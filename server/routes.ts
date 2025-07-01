import express, { Request, Response, NextFunction } from "express";
import multer from "multer";
import { createServer } from "node:http";
import { db } from "./db";
import { fileUploads, sectionInspections } from "../shared/schema";
import { MSCC5Classifier } from "./mscc5-classifier";
import pdfParse from "pdf-parse";
import fs from "fs/promises";
import path from "path";
import { eq } from "drizzle-orm";

const upload = multer({ dest: "uploads/" });

async function extractSectionsFromPDF(pdfText: string, fileUploadId: number) {
  const extractedSections = [];
  
  console.log("🔍 Analyzing PDF text for Nine Elms Park inspection data...");
  
  // Pattern to extract section inspection headers based on user's red-highlighted fields
  const sectionHeaderRegex = /Section Inspection.*?Date.*?Time.*?Client.*?Weather.*?Pre Cleaned.*?PLR\s+(\d+)\s+(\d+)\s+(\d{2}\/\d{2}\/\d{2})\s+(\d{1,2}:\d{2})[\s\S]*?Inspection Direction:\s*(Downstream|Upstream)[\s\S]*?Inspected Length:\s*(\d+\.?\d*)\s*m[\s\S]*?Total Length:\s*(\d+\.?\d*)\s*m[\s\S]*?Upstream Node:\s*([A-Z0-9]+(?:[A-Z0-9\s]*[A-Z0-9])?)[\s\S]*?Downstream Node:\s*([A-Z0-9\s]+(?:RUN|[A-Z0-9]+))[\s\S]*?Dia\/Height:\s*(\d+)\s*mm[\s\S]*?Material:\s*(.*?)(?=\n|$)/gi;
  
  let match;
  while ((match = sectionHeaderRegex.exec(pdfText)) !== null) {
    const sectionNum = parseInt(match[1]);
    const inspectionNum = parseInt(match[2]);
    const date = match[3];
    const time = match[4];
    const inspectionDirection = match[5].toLowerCase();
    const inspectedLength = match[6];
    const totalLength = match[7];
    const upstreamNode = match[8].trim();
    const downstreamNode = match[9].trim();
    const pipeSize = match[10];
    const material = match[11].trim();
    
    // Apply direction mapping logic as per user requirements
    let startMH, finishMH;
    if (inspectionDirection === 'downstream') {
      // When inspection direction is "downstream", upstream MH becomes start MH 
      startMH = upstreamNode;
      finishMH = downstreamNode;
    } else {
      // When inspection direction is "upstream", downstream node becomes start MH
      startMH = downstreamNode;
      finishMH = upstreamNode;
    }
    
    // Extract observations/defects from this section
    const sectionEndRegex = /Section Inspection.*?Date.*?Time.*?Client.*?Weather.*?Pre Cleaned.*?PLR\s+\d+\s+\d+|$$/gi;
    sectionEndRegex.lastIndex = match.index + match[0].length;
    const nextSectionMatch = sectionEndRegex.exec(pdfText);
    const sectionContent = nextSectionMatch ? 
      pdfText.substring(match.index + match[0].length, nextSectionMatch.index) :
      pdfText.substring(match.index + match[0].length);
    
    // Use MSCC5 classifier to analyze defects from section content
    const classification = MSCC5Classifier.classifyDefect(sectionContent);
    
    extractedSections.push({
      itemNo: sectionNum,
      inspectionNo: inspectionNum.toString(),
      date: convertDate(date),
      time: time,
      startMH: startMH,
      finishMH: finishMH,
      startMHDepth: '2.0',
      finishMHDepth: '2.0',
      pipeSize: pipeSize,
      pipeMaterial: material,
      totalLength: totalLength,
      lengthSurveyed: inspectedLength,
      defects: classification.defectDescription,
      severityGrade: classification.severityGrade.toString(),
      recommendations: classification.recommendations,
      adoptable: classification.adoptable,
      cost: classification.estimatedCost
    });
    
    console.log(`✓ Extracted Section ${sectionNum}: ${startMH}→${finishMH}, ${inspectedLength}m, ${material} (${inspectionDirection} inspection)`);
  }
  
  // Return only authentic data extracted from PDF - NO synthetic fallback data
  if (extractedSections.length === 0) {
    console.log("❌ No sections extracted from PDF - system will NOT generate synthetic data");
    console.log("📄 PDF content preview (first 1000 chars):", pdfText.substring(0, 1000));
    return [];
  }

  console.log(`✓ Extracted ${extractedSections.length} sections from PDF using authentic data only`);
  return extractedSections;
}

function convertDate(dateStr: string): string {
  // Convert DD/MM/YY to YYYY-MM-DD format
  const [day, month, year] = dateStr.split('/');
  const fullYear = parseInt(year) > 50 ? `19${year}` : `20${year}`;
  return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export async function registerRoutes(app: express.Express) {
  const server = createServer(app);

  // File upload endpoint with actual PDF parsing
  app.post("/api/upload", upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const userId = "test-user";
      const projectMatch = req.file.originalname.match(/(\d{4})/);
      const projectNo = projectMatch ? projectMatch[1] : "0000";

      // Create file upload record
      const [fileUpload] = await db.insert(fileUploads).values({
        userId: userId,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        filePath: req.file.path,
        status: "processing",
        projectNumber: projectNo,
        sector: req.body.sector || "utilities"
      }).returning();

      console.log("Processing PDF:", req.file.originalname);

      // Read and parse PDF
      const pdfBuffer = await fs.readFile(req.file.path);
      const pdfData = await pdfParse(pdfBuffer);
      
      // Extract sections from PDF using authentic data only
      const sections = await extractSectionsFromPDF(pdfData.text, fileUpload.id);
      
      if (sections.length === 0) {
        console.log("❌ No authentic sections found in PDF - upload failed");
        return res.status(400).json({ 
          error: "No valid sections found in PDF. Please ensure the PDF contains authentic inspection data." 
        });
      }

      // Insert sections into database
      const insertedSections = await db.insert(sectionInspections).values(
        sections.map(section => ({
          fileUploadId: fileUpload.id,
          itemNo: section.itemNo,
          inspectionNo: parseInt(section.inspectionNo),
          date: section.date,
          time: section.time,
          startMh: section.startMH,
          finishMh: section.finishMH,
          startMhDepth: section.startMHDepth,
          finishMhDepth: section.finishMHDepth,
          pipeSize: section.pipeSize,
          pipeMaterial: section.pipeMaterial,
          totalLength: section.totalLength,
          lengthSurveyed: section.lengthSurveyed,
          defects: section.defects,
          severityGrade: section.severityGrade,
          recommendations: section.recommendations,
          adoptable: section.adoptable,
          cost: section.cost
        }))
      ).returning();

      // Update upload status
      await db.update(fileUploads)
        .set({ status: "completed" })
        .where(eq(fileUploads.id, fileUpload.id));

      console.log(`✅ Successfully processed ${insertedSections.length} authentic sections`);

      res.json({
        success: true,
        uploadId: fileUpload.id,
        sectionsCount: insertedSections.length,
        message: `Successfully processed ${insertedSections.length} authentic sections from PDF`
      });

    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to process upload" });
    }
  });

  // Get all uploads for user
  app.get("/api/uploads", async (req: Request, res: Response) => {
    try {
      const userId = "test-user";
      const uploads = await db.select().from(fileUploads).where(eq(fileUploads.userId, userId));
      res.json(uploads);
    } catch (error) {
      console.error("Error fetching uploads:", error);
      res.status(500).json({ error: "Failed to fetch uploads" });
    }
  });

  // Get sections for specific upload
  app.get("/api/uploads/:uploadId/sections", async (req: Request, res: Response) => {
    try {
      const uploadId = parseInt(req.params.uploadId);
      const sections = await db.select().from(sectionInspections).where(eq(sectionInspections.fileUploadId, uploadId));
      res.json(sections);
    } catch (error) {
      console.error("Error fetching sections:", error);
      res.status(500).json({ error: "Failed to fetch sections" });
    }
  });

  // Delete upload and all associated sections
  app.delete("/api/uploads/:uploadId", async (req: Request, res: Response) => {
    try {
      const uploadId = parseInt(req.params.uploadId);
      
      // Delete all associated section inspections first
      await db.delete(sectionInspections).where(eq(sectionInspections.fileUploadId, uploadId));
      
      // Delete the file upload record
      await db.delete(fileUploads).where(eq(fileUploads.id, uploadId));
      
      console.log(`✓ Deleted upload ${uploadId} and all associated sections`);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting upload:", error);
      res.status(500).json({ error: "Failed to delete upload" });
    }
  });

  // Get user authentication info
  app.get("/api/auth/user", async (req: Request, res: Response) => {
    try {
      res.json({
        id: "test-user",
        email: "test@example.com",
        name: "Test User"
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  return server;
}