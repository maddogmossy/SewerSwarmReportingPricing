import express, { type Express, type Request, type Response } from "express";
import { createServer } from "http";
import multer from "multer";
import path from "path";
import fs, { existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { db } from "./db";
import { storage } from "./storage";
import { fileUploads, users, sectionInspections, sectionDefects, equipmentTypes, pricingRules, sectorStandards, projectFolders, repairMethods, repairPricing, workCategories, depotSettings, travelCalculations, vehicleTravelRates } from "@shared/schema";
import { eq, desc, asc, and } from "drizzle-orm";
import { MSCC5Classifier } from "./mscc5-classifier";
import { SEWER_CLEANING_MANUAL } from "./sewer-cleaning";
import { DataIntegrityValidator, validateBeforeInsert } from "./data-integrity";
import { WorkflowTracker } from "./workflow-tracker";
import { searchUKAddresses } from "./address-autocomplete.js";

import Stripe from "stripe";
import { setupAuth } from "./replitAuth";
import fetch from "node-fetch";
import { handleVehicleDefaults } from "./vehicle-defaults";
import { initializeFuelPriceMonitoring, FuelPriceMonitor } from "./fuel-price-monitor";


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Missing STRIPE_SECRET_KEY - running in demo mode');
}
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.db', '.db3', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext) || file.originalname.endsWith('meta.db3')) {
      cb(null, true);
    } else {
      cb(new Error('Only database files (.db, .db3, meta.db3) and PDF files are allowed'));
    }
  }
});

// Separate multer configuration for image uploads (logos)
const logoUpload = multer({
  dest: "uploads/logos/",
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for logos
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, GIF, WebP) are allowed'));
    }
  }
});

// Function to automatically fetch logo from company website
async function fetchLogoFromWebsite(websiteUrl: string): Promise<string | null> {
  try {
    // Normalize the URL
    let url = websiteUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    // Try multiple common logo paths
    const logoUrls = [
      `${url}/favicon.ico`,
      `${url}/logo.png`,
      `${url}/logo.jpg`,
      `${url}/assets/logo.png`,
      `${url}/images/logo.png`,
      `${url}/static/logo.png`
    ];

    // First try direct logo URLs
    for (const logoUrl of logoUrls) {
      try {
        const logoResponse = await fetch(logoUrl);
        if (logoResponse.ok && logoResponse.headers.get('content-type')?.startsWith('image/')) {
          const buffer = await logoResponse.buffer();
          const fileExtension = logoUrl.split('.').pop()?.split('?')[0] || 'png';
          const filename = `auto-logo-${Date.now()}.${fileExtension}`;
          const filepath = path.join('uploads/logos', filename);
          
          await fs.promises.mkdir('uploads/logos', { recursive: true });
          await fs.promises.writeFile(filepath, buffer);
          
          return filepath;
        }
      } catch (error) {
        continue;
      }
    }

    // If direct URLs fail, try to parse HTML for meta tags
    try {
      const htmlResponse = await fetch(url);
      if (htmlResponse.ok) {
        const html = await htmlResponse.text();
        
        // Look for various logo meta tags
        const metaPatterns = [
          /<meta property="og:image" content="([^"]+)"/i,
          /<meta name="twitter:image" content="([^"]+)"/i,
          /<link rel="icon" href="([^"]+)"/i,
          /<link rel="shortcut icon" href="([^"]+)"/i,
          /<meta property="og:image:url" content="([^"]+)"/i
        ];

        for (const pattern of metaPatterns) {
          const match = html.match(pattern);
          if (match) {
            let logoUrl = match[1];
            
            // Handle relative URLs
            if (logoUrl.startsWith('/')) {
              logoUrl = url + logoUrl;
            } else if (!logoUrl.startsWith('http')) {
              logoUrl = url + '/' + logoUrl;
            }

            try {
              const logoResponse = await fetch(logoUrl);
              if (logoResponse.ok && logoResponse.headers.get('content-type')?.startsWith('image/')) {
                const buffer = await logoResponse.buffer();
                const fileExtension = logoUrl.split('.').pop()?.split('?')[0] || 'png';
                const filename = `auto-logo-${Date.now()}.${fileExtension}`;
                const filepath = path.join('uploads/logos', filename);
                
                await fs.promises.mkdir('uploads/logos', { recursive: true });
                await fs.promises.writeFile(filepath, buffer);
                
                return filepath;
              }
            } catch (error) {
              continue;
            }
          }
        }
      }
    } catch (error) {
    }

    return null;
  } catch (error) {
    return null;
  }
}

// Handler function following the pattern you provided
async function validateDb3Handler(req: Request, res: Response) {
  try {
    const directory = req.body.directory || req.query.directory || '/mnt/data';
    const { validateGenericDb3Files } = await import('./db3-validator');
    
    const validation = validateGenericDb3Files(directory as string);

    if (!validation.valid) {
      return res.status(400).json({ error: validation.message });
    }

    // Check if meta file is present
    const hasMetaDb = !!validation.files?.meta;

    // Proceed to read both .db3 and _Meta.db3 files using sqlite3 or better-sqlite3
    // TODO: extract grading, observations, node refs, etc
    res.status(200).json({ 
      message: validation.message,
      warning: validation.warning,
      hasMetaDb
    });
  } catch (error) {
    console.error('Database validation error:', error);
    res.status(500).json({ error: 'Internal server error during validation' });
  }
}

export async function registerRoutes(app: Express) {
  const server = createServer(app);

  // Test auth bypass - provide unlimited access without trial
  app.get('/api/auth/user', async (req, res) => {
    res.json({
      id: 'test-user',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      subscriptionStatus: 'unlimited',
      access: 'unlimited',
      role: 'admin',
      trialReportsRemaining: 999,
      hasActiveSubscription: true
    });
  });

  // Company Settings API endpoints - positioned early to avoid route conflicts
  app.get("/api/company-settings", async (req: Request, res: Response) => {
    try {
      const userId = "test-user"; // Default user for testing
      const companySettings = await storage.getCompanySettings(userId);
      res.json(companySettings || {});
    } catch (error) {
      console.error("Error fetching company settings:", error);
      res.status(500).json({ error: "Failed to fetch company settings" });
    }
  });

  app.put("/api/company-settings", logoUpload.single("companyLogo"), async (req: Request, res: Response) => {
    try {
      const userId = "test-user"; // Default user for testing
      let updates = req.body;
      
      // Get current settings to check for existing logo file
      const currentSettings = await storage.getCompanySettings(userId);
      const currentLogoPath = currentSettings?.companyLogo;
      
      // Handle logo upload if present
      if (req.file) {
        updates.companyLogo = req.file.path;
        
        // Delete old logo file if it exists and we're replacing it
        if (currentLogoPath && fs.existsSync(currentLogoPath)) {
          try {
            fs.unlinkSync(currentLogoPath);
          } catch (error) {
            console.warn("⚠️ Could not delete old logo file:", error);
          }
        }
      }
      
      // Handle logo deletion (when companyLogo is explicitly set to empty string)
      if (updates.companyLogo === '' && currentLogoPath) {
        // Delete the physical file
        if (fs.existsSync(currentLogoPath)) {
          try {
            fs.unlinkSync(currentLogoPath);
          } catch (error) {
            console.warn("⚠️ Could not delete logo file:", error);
          }
        }
        updates.companyLogo = null; // Set to null in database
      }
      
      const updatedSettings = await storage.updateCompanySettings(userId, updates);
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating company settings:", error);
      res.status(500).json({ error: "Failed to update company settings" });
    }
  });

  // Depot Settings API endpoints
  app.get("/api/depot-settings", async (req: Request, res: Response) => {
    try {
      const userId = "test-user"; // Default user for testing
      const depotSettings = await storage.getDepotSettings(userId);
      res.json(depotSettings || []);
    } catch (error) {
      console.error("Error fetching depot settings:", error);
      res.status(500).json({ error: "Failed to fetch depot settings" });
    }
  });

  app.post("/api/depot-settings", async (req: Request, res: Response) => {
    try {
      const userId = "test-user"; // Default user for testing
      const depotData = { ...req.body, adminUserId: userId };
      const newDepot = await storage.createDepotSettings(depotData);
      res.json(newDepot);
    } catch (error) {
      console.error("Error creating depot settings:", error);
      res.status(500).json({ error: "Failed to create depot settings" });
    }
  });

  app.put("/api/depot-settings/:id", async (req: Request, res: Response) => {
    try {
      const depotId = parseInt(req.params.id);
      const updates = req.body;
      const updatedDepot = await storage.updateDepotSettings(depotId, updates);
      res.json(updatedDepot);
    } catch (error) {
      console.error("Error updating depot settings:", error);
      res.status(500).json({ error: "Failed to update depot settings" });
    }
  });

  // Team Members API endpoints
  app.get("/api/team-members", async (req: Request, res: Response) => {
    try {
      const userId = "test-user"; // Default user for testing
      const teamMembers = await storage.getTeamMembers(userId);
      res.json(teamMembers || []);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ error: "Failed to fetch team members" });
    }
  });

  app.post("/api/invite-team-member", async (req: Request, res: Response) => {
    try {
      const userId = "test-user"; // Default user for testing
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // Create invitation
      const invitation = {
        adminUserId: userId,
        email,
        token: Math.random().toString(36).substring(2, 15),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        status: 'pending' as const
      };
      
      const createdInvitation = await storage.createTeamInvitation(invitation);
      res.json({ message: "Invitation sent successfully", invitation: createdInvitation });
    } catch (error) {
      console.error("Error inviting team member:", error);
      res.status(500).json({ error: "Failed to send invitation" });
    }
  });

  // Payment Methods API endpoints (placeholder for Stripe integration)
  app.get("/api/payment-methods", async (req: Request, res: Response) => {
    try {
      // Placeholder response for payment methods
      res.json([]);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      res.status(500).json({ error: "Failed to fetch payment methods" });
    }
  });

  app.post("/api/update-payment-method", async (req: Request, res: Response) => {
    try {
      const { paymentMethodId } = req.body;
      // Placeholder for payment method update
      res.json({ message: "Payment method updated successfully" });
    } catch (error) {
      console.error("Error updating payment method:", error);
      res.status(500).json({ error: "Failed to update payment method" });
    }
  });

  // Vehicle Travel Rates API endpoints
  app.get("/api/vehicle-travel-rates", async (req: Request, res: Response) => {
    try {
      const userId = "test-user"; // Default user for testing
      const vehicleRates = await storage.getVehicleTravelRates(userId);
      res.json(vehicleRates || []);
    } catch (error) {
      console.error("Error fetching vehicle travel rates:", error);
      res.status(500).json({ error: "Failed to fetch vehicle travel rates" });
    }
  });

  app.post("/api/vehicle-travel-rates", async (req: Request, res: Response) => {
    try {
      const userId = "test-user"; // Default user for testing
      const rateData = { ...req.body, userId };
      const newRate = await storage.createVehicleTravelRate(rateData);
      res.json(newRate);
    } catch (error) {
      console.error("Error creating vehicle travel rate:", error);
      res.status(500).json({ error: "Failed to create vehicle travel rate" });
    }
  });

  app.put("/api/vehicle-travel-rates/:id", async (req: Request, res: Response) => {
    try {
      const rateId = parseInt(req.params.id);
      const updates = req.body;
      const updatedRate = await storage.updateVehicleTravelRate(rateId, updates);
      res.json(updatedRate);
    } catch (error) {
      console.error("Error updating vehicle travel rate:", error);
      res.status(500).json({ error: "Failed to update vehicle travel rate" });
    }
  });

  app.delete("/api/vehicle-travel-rates/:id", async (req: Request, res: Response) => {
    try {
      const rateId = parseInt(req.params.id);
      await storage.deleteVehicleTravelRate(rateId);
      res.json({ message: "Vehicle travel rate deleted successfully" });
    } catch (error) {
      console.error("Error deleting vehicle travel rate:", error);
      res.status(500).json({ error: "Failed to delete vehicle travel rate" });
    }
  });

  // File upload endpoint for database files only
  app.post("/api/upload", upload.single("file"), async (req: Request, res: Response) => {
    try {
      console.log('🔍 UPLOAD ROUTE - Start processing');
      console.log('🔍 req.file:', req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      } : 'NO FILE');
      console.log('🔍 req.body:', req.body);
      console.log('🔍 req.files:', req.files);
      
      if (!req.file) {
        console.log('❌ No file uploaded');
        return res.status(400).json({ error: "No file uploaded" });
      }

      const userId = "test-user";
      const projectMatch = req.file.originalname.match(/(\d{4})/);
      const projectNo = projectMatch ? projectMatch[1] : "0000";
      
      // Check if this file already exists and has a sector assigned
      const existingUpload = await db.select().from(fileUploads)
        .where(and(
          eq(fileUploads.userId, userId),
          eq(fileUploads.fileName, req.file.originalname)
        ))
        .limit(1);
      
      // If file exists with sector, reprocess it with existing sector instead of requiring selection
      if (existingUpload.length > 0 && existingUpload[0].sector && !req.body.sector) {
        req.body.sector = existingUpload[0].sector;
      }
      
      // Handle folder assignment and visit number
      let folderId = null;
      let visitNumber = 1;
      
      if (req.body.folderId) {
        folderId = parseInt(req.body.folderId);
        
        // Count existing files in this folder to determine visit number
        const existingFiles = await db.select().from(fileUploads)
          .where(eq(fileUploads.folderId, folderId));
        visitNumber = existingFiles.length + 1;
      } else if (existingUpload.length > 0 && existingUpload[0].folderId) {
        // Use existing folder if no new folder specified
        folderId = existingUpload[0].folderId;
      }

      // Create or update file upload record
      let fileUpload;
      if (existingUpload.length > 0) {
        // Update existing upload record
        [fileUpload] = await db.update(fileUploads)
          .set({
            fileSize: req.file.size,
            fileType: req.file.mimetype,
            filePath: req.file.path,
            status: "processing",
            sector: req.body.sector || existingUpload[0].sector,
            folderId: folderId !== null ? folderId : existingUpload[0].folderId,
            updatedAt: new Date()
          })
          .where(eq(fileUploads.id, existingUpload[0].id))
          .returning();
      } else {
        // Create new upload record
        [fileUpload] = await db.insert(fileUploads).values({
          userId: userId,
          folderId: folderId,
          fileName: req.file.originalname,
          fileSize: req.file.size,
          fileType: req.file.mimetype,
          filePath: req.file.path,
          status: "processing",
          projectNumber: projectNo,
          visitNumber: visitNumber,
          sector: req.body.sector || "utilities"
        }).returning();
      }


      // Check file type and process accordingly
      if (req.file.originalname.endsWith('.db') || req.file.originalname.endsWith('.db3') || req.file.originalname.endsWith('meta.db3')) {
        // Process database files with validation
        try {
          const filePath = req.file.path;
          const uploadDirectory = path.dirname(filePath);
          
          
          // Import validation function
          const { validateGenericDb3Files } = await import('./db3-validator');
          
          // Validate that both .db3 and _Meta.db3 files are present
          const validation = validateGenericDb3Files(uploadDirectory);
          
          if (!validation.valid) {
            // Update status to failed due to missing files
            await db.update(fileUploads)
              .set({ 
                status: "failed",
                extractedData: JSON.stringify({
                  error: validation.message,
                  extractionType: "wincan_database_validation_failed"
                })
              })
              .where(eq(fileUploads.id, fileUpload.id));
            
            return res.status(400).json({ 
              error: validation.message,
              uploadId: fileUpload.id,
              status: "failed"
            });
          }
          
          
          // Log warning if meta file is missing
          if (validation.warning) {
            console.warn(validation.warning);
          }
          
          // Clear any existing sections for this file upload to prevent duplicates
          await db.delete(sectionInspections).where(eq(sectionInspections.fileUploadId, fileUpload.id));
          
          // Import and use Wincan database reader (restored main version)
          const { readWincanDatabase, storeWincanSections } = await import('./wincan-db-reader');
          
          // Use the uploaded file for processing
          const mainDbPath = filePath;
          
          // Extract authentic data from database with enhanced debugging
          console.log('🔍 Processing database file:', mainDbPath);
          console.log('🔍 Sector:', req.body.sector || 'utilities');
          console.log('🔍 File exists:', fs.existsSync(mainDbPath));
          
          let sections, detectedFormat;
          try {
            console.log('🔍 Calling readWincanDatabase...');
            const result = await readWincanDatabase(mainDbPath, req.body.sector || 'utilities', fileUpload.id);
            sections = result.sections;
            detectedFormat = result.detectedFormat;
            console.log(`✅ readWincanDatabase completed successfully - Detected format: ${detectedFormat}`);
          } catch (readError) {
            console.error('❌ readWincanDatabase failed:', readError);
            console.error('❌ Error details:', {
              message: readError.message,
              stack: readError.stack,
              name: readError.name
            });
            throw new Error(`Database reading failed: ${readError.message}`);
          }
          
          console.log('📊 SECSTAT Processing Results:');
          console.log(`📊 Total sections extracted: ${sections.length}`);
          
          // Log severity grade samples for verification
          const sectionsWithGrades = sections.filter(s => s.severityGrade > 0);
          console.log(`📊 Sections with severity grades: ${sectionsWithGrades.length}`);
          
          if (sectionsWithGrades.length > 0) {
            console.log('📊 Sample severity data:', sectionsWithGrades.slice(0, 3).map(s => ({
              item: s.itemNo,
              severity: s.severityGrade,
              defectType: s.defectType,
              defects: s.defects.substring(0, 50) + '...'
            })));
          }
          
          
          // Store sections in database
          if (sections.length > 0) {
            await storeWincanSections(sections, fileUpload.id);
          }
          
          // Update file upload status to completed
          await db.update(fileUploads)
            .set({ 
              extractedData: JSON.stringify({
                sectionsCount: sections.length,
                extractionType: "wincan_database",
                validationMessage: validation.message,
                status: "completed"
              })
            })
            .where(eq(fileUploads.id, fileUpload.id));
          
          res.json({
            message: "Database file processed successfully",
            uploadId: fileUpload.id,
            sectionsExtracted: sections.length,
            status: "completed",
            validation: validation.message,
            warning: validation.warning,
            hasMetaDb: !!validation.files?.meta
          });
          
        } catch (dbError) {
          console.error("Database processing error:", dbError);
          // Update status to failed since we couldn't extract sections
          await db.update(fileUploads)
            .set({ extractedData: "failed" })
            .where(eq(fileUploads.id, fileUpload.id));
          
          throw new Error(`Database processing failed: ${dbError.message}`);
        }
      } else if (req.file.originalname.toLowerCase().endsWith('.pdf')) {
        // Process PDF files
        try {
          
          // Clear any existing sections for this file upload to prevent duplicates
          await db.delete(sectionInspections).where(eq(sectionInspections.fileUploadId, fileUpload.id));
          
          // Import PDF processing functionality
          const { processPDF } = await import('./pdf-processor');
          
          // Process PDF and extract sections
          const sections = await processPDF(req.file.path, fileUpload.id, req.body.sector || 'utilities');
          
          
          // Update file upload status to completed
          await db.update(fileUploads)
            .set({ 
              extractedData: JSON.stringify({
                sectionsCount: sections.length,
                extractionType: "pdf",
                status: "completed"
              })
            })
            .where(eq(fileUploads.id, fileUpload.id));
          
          res.json({
            message: "PDF file processed successfully",
            uploadId: fileUpload.id,
            sectionsExtracted: sections.length,
            status: "completed"
          });
          
        } catch (pdfError) {
          console.error("PDF processing error:", pdfError);
          // Update status to failed since we couldn't extract sections
          await db.update(fileUploads)
            .set({ extractedData: "failed" })
            .where(eq(fileUploads.id, fileUpload.id));
          
          throw new Error(`PDF processing failed: ${pdfError.message}`);
        }
      } else {
        // Unsupported file type
        await db.update(fileUploads)
          .set({ extractedData: "failed" })
          .where(eq(fileUploads.id, fileUpload.id));
        
        return res.status(400).json({ 
          error: "Unsupported file type. Only database files (.db, .db3, meta.db3) and PDF files are supported." 
        });
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Get file uploads
  app.get("/api/uploads", async (req: Request, res: Response) => {
    try {
      const userId = "test-user";
      const uploads = await db.select()
        .from(fileUploads)
        .where(eq(fileUploads.userId, userId))
        .orderBy(desc(fileUploads.createdAt));
      res.json(uploads);
    } catch (error) {
      console.error("Error fetching uploads:", error);
      res.status(500).json({ error: "Failed to fetch uploads" });
    }
  });

  // Re-process upload: Re-read database files and clear caches
  app.post("/api/uploads/:id/reprocess", async (req: Request, res: Response) => {
    try {
      const uploadId = parseInt(req.params.id);
      console.log(`🔄 REPROCESS - Starting reprocessing for upload ${uploadId}`);
      
      // Get the current upload record
      const upload = await db.select()
        .from(fileUploads)
        .where(eq(fileUploads.id, uploadId))
        .limit(1);
      
      if (upload.length === 0) {
        return res.status(404).json({ error: "Upload not found" });
      }
      
      const currentUpload = upload[0];
      console.log(`🔄 REPROCESS - Found upload: ${currentUpload.fileName}`);
      
      // Clear existing section data for this upload
      await db.delete(sectionInspections)
        .where(eq(sectionInspections.fileUploadId, uploadId));
      console.log(`🔄 REPROCESS - Cleared existing section data`);
      
      // Re-read the database file using the stored file path
      const filePath = currentUpload.filePath;
      if (!filePath || !fs.existsSync(filePath)) {
        return res.status(400).json({ error: "Original database file not found" });
      }
      
      console.log(`🔄 REPROCESS - Re-reading database file: ${filePath}`);
      
      // Process the database file again with WRc validation fix
      const { readWincanDatabase, storeWincanSections } = await import('./wincan-db-reader');
      const result = await readWincanDatabase(filePath);
      const sections = result.sections || result; // Handle both return formats
      console.log(`🔄 REPROCESS - Extracted ${sections.length} sections with WRc validation`);
      
      // Store the re-processed sections using the proper function
      if (sections.length > 0) {
        await storeWincanSections(sections, uploadId);
      }
      
      // Update upload status to ensure it appears in dashboard
      await db.update(fileUploads)
        .set({ 
          status: "completed",
          updatedAt: new Date()
        })
        .where(eq(fileUploads.id, uploadId));
      
      console.log(`🔄 REPROCESS - Successfully reprocessed ${sections.length} sections`);
      
      // Return success with cache-busting headers
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      res.json({ 
        success: true, 
        message: `Successfully reprocessed ${sections.length} sections with WRc validation fix`,
        sectionsCount: sections.length,
        uploadId: uploadId
      });
      
    } catch (error) {
      console.error("🔄 REPROCESS - Error:", error);
      res.status(500).json({ error: "Failed to reprocess upload" });
    }
  });

  // Get sections for an upload
  app.get("/api/uploads/:id/sections", async (req: Request, res: Response) => {
    try {
      const uploadId = parseInt(req.params.id);
      console.log(`🔍 SECTIONS API - Fetching sections for upload ${uploadId}`);
      
      const sections = await db.select()
        .from(sectionInspections)
        .where(eq(sectionInspections.fileUploadId, uploadId))
        .orderBy(asc(sectionInspections.itemNo), asc(sectionInspections.letterSuffix));

      console.log(`🔍 SECTIONS API - Found ${sections.length} sections total`);
      
      // Log items 4, 6, 8, 9 specifically to debug the WRc validation fix
      const targetItems = sections.filter(s => [4, 6, 8, 9].includes(s.itemNo));
      console.log('🔍 SECTIONS API - Target items with line deviations:', targetItems.map(s => ({
        itemNo: s.itemNo,
        defects: s.defects,
        severityGrade: s.severityGrade,
        defectType: s.defectType
      })));

      // Transform sections to include severityGrades structure expected by dashboard
      const transformedSections = sections.map(section => ({
        ...section,
        severityGrades: {
          structural: section.defectType === 'structural' ? parseInt(section.severityGrade) || 0 : 0,
          service: section.defectType === 'service' ? parseInt(section.severityGrade) || 0 : 0
        }
      }));

      // Clear caching headers to force fresh data
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      res.json(transformedSections);
    } catch (error) {
      console.error("Error fetching sections:", error);
      res.status(500).json({ error: "Failed to fetch sections" });
    }
  });

  // Get standard categories for pricing
  app.get("/api/standard-categories", async (req: Request, res: Response) => {
    try {
      const categories = await db.select().from(sectorStandards).orderBy(asc(sectorStandards.standardName));
      res.json(categories);
    } catch (error) {
      console.error("Error fetching standard categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // Get equipment types
  app.get("/api/equipment-types", async (req: Request, res: Response) => {
    try {
      const equipment = await db.select().from(equipmentTypes).orderBy(asc(equipmentTypes.name));
      res.json(equipment);
    } catch (error) {
      console.error("Error fetching equipment types:", error);
      res.status(500).json({ error: "Failed to fetch equipment types" });
    }
  });

  // Get sector standards
  app.get("/api/sector-standards/:sector", async (req: Request, res: Response) => {
    try {
      const { sector } = req.params;
      const standards = await db.select()
        .from(sectorStandards)
        .where(eq(sectorStandards.sector, sector))
        .orderBy(asc(sectorStandards.standardName));
      res.json(standards);
    } catch (error) {
      console.error("Error fetching sector standards:", error);
      res.status(500).json({ error: "Failed to fetch sector standards" });
    }
  });

  // Sector standards endpoint specifically for sectors like utilities
  app.get("/api/sector-standards", async (req: Request, res: Response) => {
    try {
      const { sector } = req.query;
      let standards;
      
      if (sector) {
        standards = await db.select()
          .from(sectorStandards)
          .where(eq(sectorStandards.sector, sector as string))
          .orderBy(asc(sectorStandards.standardName));
      } else {
        standards = await db.select()
          .from(sectorStandards)
          .orderBy(asc(sectorStandards.sector), asc(sectorStandards.standardName));
      }
      
      res.json(standards);
    } catch (error) {
      console.error("Error fetching sector standards:", error);
      res.status(500).json({ error: "Failed to fetch sector standards" });
    }
  });

  // Delete upload and its sections
  app.delete("/api/uploads/:id", async (req: Request, res: Response) => {
    try {
      const uploadId = parseInt(req.params.id);
      
      // Delete all sections first
      await db.delete(sectionInspections).where(eq(sectionInspections.fileUploadId, uploadId));
      
      // Get file info to delete physical file
      const upload = await db.select().from(fileUploads).where(eq(fileUploads.id, uploadId)).limit(1);
      
      // Delete upload record
      await db.delete(fileUploads).where(eq(fileUploads.id, uploadId));
      
      // Delete physical file if it exists
      if (upload.length > 0 && upload[0].filePath) {
        try {
          if (existsSync(upload[0].filePath)) {
            fs.unlinkSync(upload[0].filePath);
          }
        } catch (error) {
          console.warn("Could not delete physical file:", error);
        }
      }
      
      res.json({ message: "Upload deleted successfully" });
    } catch (error) {
      console.error("Error deleting upload:", error);
      res.status(500).json({ error: "Failed to delete upload" });
    }
  });

  // Project folders API
  app.get("/api/folders", async (req: Request, res: Response) => {
    try {
      const userId = "test-user";
      const folders = await db.select()
        .from(projectFolders)
        .where(eq(projectFolders.userId, userId))
        .orderBy(desc(projectFolders.createdAt));
      res.json(folders);
    } catch (error) {
      console.error("Error fetching folders:", error);
      res.status(500).json({ error: "Failed to fetch folders" });
    }
  });

  app.post("/api/folders", async (req: Request, res: Response) => {
    try {
      const userId = "test-user";
      const { folderName, projectAddress, projectPostcode, projectNumber, travelDistance, travelTime, addressValidated } = req.body;
      
      console.log('🔍 Folder creation request body:', { folderName, projectAddress, typeof_folderName: typeof folderName });
      
      // Validate that folderName is provided and not empty
      if (!folderName || typeof folderName !== 'string' || folderName.trim().length === 0) {
        console.log('❌ Folder validation failed:', { folderName, typeof_folderName: typeof folderName });
        return res.status(400).json({ error: "Folder name is required" });
      }
      
      console.log('✅ Folder validation passed, creating folder:', folderName.trim());
      
      const [folder] = await db.insert(projectFolders).values({
        userId,
        folderName: folderName.trim(),
        projectAddress: projectAddress || "Not specified",
        projectPostcode: projectPostcode || null,
        projectNumber: projectNumber || null,
        travelDistance: travelDistance || null,
        travelTime: travelTime || null,
        addressValidated: addressValidated || false
      }).returning();
      
      console.log('✅ Folder created successfully:', folder);
      res.json(folder);
    } catch (error) {
      console.error("Error creating folder:", error);
      res.status(500).json({ error: "Failed to create folder" });
    }
  });

  // Address autocomplete endpoint
  app.get("/api/address-autocomplete", async (req: Request, res: Response) => {
    try {
      const { query } = req.query;
      if (!query || typeof query !== 'string') {
        return res.json([]);
      }
      
      const addresses = await searchUKAddresses(query);
      res.json(addresses);
    } catch (error) {
      console.error("Error in address autocomplete:", error);
      res.status(500).json({ error: "Failed to search addresses" });
    }
  });

  // Logo upload endpoint
  app.post("/api/upload-logo", logoUpload.single("logo"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No logo file uploaded" });
      }

      res.json({
        message: "Logo uploaded successfully",
        filename: req.file.filename,
        path: req.file.path
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      res.status(500).json({ error: "Failed to upload logo" });
    }
  });

  // Auto-fetch logo from website
  app.post("/api/auto-fetch-logo", async (req: Request, res: Response) => {
    try {
      const { websiteUrl } = req.body;
      
      if (!websiteUrl) {
        return res.status(400).json({ error: "Website URL is required" });
      }

      const logoPath = await fetchLogoFromWebsite(websiteUrl);
      
      if (logoPath) {
        res.json({
          message: "Logo fetched successfully",
          logoPath: logoPath.replace('uploads/', '')
        });
      } else {
        res.status(404).json({ error: "Could not find a suitable logo from the website" });
      }
    } catch (error) {
      console.error("Error auto-fetching logo:", error);
      res.status(500).json({ error: "Failed to fetch logo from website" });
    }
  });



  // Database validation endpoint
  app.post("/api/validate-db3", validateDb3Handler);
  app.get("/api/validate-db3", validateDb3Handler);
  
  // Load survey endpoint using the validation pattern
  app.get("/api/load-survey", validateDb3Handler);

  // Serve logo files through API endpoint - MOVED TO TOP OF registerRoutes function
  app.get('/api/logo/:filename', (req, res) => {
    const filename = req.params.filename;
    const logoPath = path.join(process.cwd(), 'uploads', 'logos', filename);
    
    
    if (fs.existsSync(logoPath)) {
      // Set proper content type for PNG images
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      
      // Use absolute path and proper method
      const absolutePath = path.resolve(logoPath);
      
      res.sendFile(absolutePath, (err) => {
        if (err) {
          console.error('Error sending file:', err);
          res.status(500).json({ error: 'Failed to send logo file' });
        } else {
        }
      });
    } else {
      res.status(404).json({ error: 'Logo not found' });
    }
  });

  // Payment methods endpoints
  app.get('/api/payment-methods', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // This would get customer's payment methods from Stripe/PayPal
      // For demo purposes, returning sample data showing all three types
      const sampleMethods = [
        {
          id: 'card_1',
          type: 'card',
          card: {
            brand: 'visa',
            last4: '4242',
            exp_month: 12,
            exp_year: 2026
          },
          isDefault: true
        },
        {
          id: 'applepay_1',
          type: 'apple_pay',
          isDefault: false
        },
        {
          id: 'paypal_1', 
          type: 'paypal',
          isDefault: false
        }
      ];

      // For now return empty array - user can add methods
      res.json([]);
    } catch (error: any) {
      console.error('Error fetching payment methods:', error);
      res.status(500).json({ error: 'Failed to fetch payment methods' });
    }
  });

  app.post('/api/payment-methods', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { paymentMethodId, type, enabled } = req.body;


      // Handle different payment method types
      switch (type) {
        case 'card':
          // This would attach Stripe payment method to customer
          break;
        case 'apple_pay':
          // This would enable Apple Pay for the customer
          break;
        case 'paypal':
          // This would connect PayPal account
          break;
        default:
          return res.status(400).json({ error: 'Invalid payment method type' });
      }

      // Return success with mock ID
      res.json({ 
        success: true, 
        id: `${type}_${Date.now()}`,
        type,
        paymentMethodId 
      });
    } catch (error: any) {
      console.error('Error adding payment method:', error);
      res.status(500).json({ error: 'Failed to add payment method' });
    }
  });

  app.post('/api/update-default-payment-method', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { paymentMethodId } = req.body;


      // This would update default payment method across all payment providers
      // Stripe, Apple Pay, or PayPal depending on the method type
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error updating default payment method:', error);
      res.status(500).json({ error: 'Failed to update default payment method' });
    }
  });

  app.delete('/api/payment-methods/:paymentMethodId', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { paymentMethodId } = req.params;


      // This would handle removal based on method type:
      // - Stripe: detach payment method
      // - Apple Pay: disable for customer
      // - PayPal: disconnect account
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting payment method:', error);
      res.status(500).json({ error: 'Failed to delete payment method' });
    }
  });

  // PayPal payment routes temporarily disabled
  app.get("/paypal/setup", async (req, res) => {
      res.status(503).json({ error: "PayPal integration temporarily disabled" });
  });

  app.post("/paypal/order", async (req, res) => {
    res.status(503).json({ error: "PayPal integration temporarily disabled" });
  });

  app.post("/paypal/order/:orderID/capture", async (req, res) => {
    res.status(503).json({ error: "PayPal integration temporarily disabled" });
  });

  // Categories for vehicle travel rates dropdown
  app.get("/api/pr2-configurations", async (req: Request, res: Response) => {
    try {
      const userId = "test-user"; // Default user for testing
      // Import pr2Configurations here to avoid circular imports
      const { pr2Configurations } = await import("@shared/schema");
      const configs = await db.select({
        id: pr2Configurations.id,
        categoryName: pr2Configurations.categoryName,
        sector: pr2Configurations.sector,
      }).from(pr2Configurations)
        .where(eq(pr2Configurations.userId, userId));
      
      res.json(configs);
    } catch (error) {
      console.error("Error fetching PR2 configurations:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // Work categories for vehicle travel rates (standard categories 15-27)
  app.get("/api/work-categories", async (req: Request, res: Response) => {
    try {
      const categories = await storage.getWorkCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching work categories:", error);
      res.status(500).json({ error: "Failed to fetch work categories" });
    }
  });

  // Vehicle defaults endpoint - returns MPG averages and default values for vehicle types
  app.get('/api/vehicle-defaults/:vehicleType', handleVehicleDefaults);

  // Fuel price monitoring endpoints
  app.get('/api/fuel-prices/latest', async (req: Request, res: Response) => {
    try {
      const monitor = FuelPriceMonitor.getInstance();
      const latestPrices = await monitor.getLatestFuelPrices();
      
      if (!latestPrices) {
        // Return default prices if no data in database yet
        res.json({
          diesel: 1.4291, // £1.4291 per litre (current UK average)
          petrol: 1.3550, // £1.3550 per litre
          source: 'Default UK Average',
          lastUpdated: new Date().toISOString()
        });
      } else {
        res.json({
          diesel: latestPrices.diesel,
          petrol: latestPrices.petrol,
          source: 'Database',
          lastUpdated: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error getting latest fuel prices:', error);
      res.status(500).json({ error: 'Failed to get fuel prices' });
    }
  });

  // Manual fuel price update trigger (for testing)
  app.post('/api/fuel-prices/update', async (req: Request, res: Response) => {
    try {
      const monitor = FuelPriceMonitor.getInstance();
      await monitor.triggerUpdate();
      res.json({ message: 'Fuel price update triggered successfully' });
    } catch (error) {
      console.error('Error triggering fuel price update:', error);
      res.status(500).json({ error: 'Failed to trigger fuel price update' });
    }
  });

  return server;
}