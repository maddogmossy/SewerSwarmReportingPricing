import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { readWincanDatabase, storeWincanSections } from "./wincan-db-reader";
import { getSectorStandards, getAllSectorStandards } from "./sector-standards";
import { db } from "./db";
import { pr2Configurations, standardCategories } from "../shared/schema";
import { eq, sql } from "drizzle-orm";

// Debug: Test import at module level
console.log('Testing sector standards import...');
console.log('getSectorStandards function:', typeof getSectorStandards);
const testStandards = getSectorStandards('utilities');
console.log('Test utilities standards:', testStandards ? 'SUCCESS' : 'FAILED');
console.log('Standards count:', testStandards?.standards?.length || 0);

// Helper function to determine defect type from defects text
function determineDefectType(defectsText: string): 'structural' | 'service' {
  if (!defectsText || defectsText === 'No service or structural defect found') {
    return 'service';
  }
  
  const upperText = defectsText.toUpperCase();
  
  // Check for structural defects
  if (upperText.includes('DEFORMED') || upperText.includes('FRACTURE') || 
      upperText.includes('CRACK') || upperText.includes('JOINT') ||
      upperText.includes('D ') || upperText.includes('FC ') || 
      upperText.includes('FL ') || upperText.includes('CR ') ||
      upperText.includes('JDL') || upperText.includes('JDS')) {
    return 'structural';
  }
  
  // Otherwise assume service defect
  return 'service';
}

// SRM grading calculation function
function getSRMGrading(grade: number, type: 'structural' | 'service') {
  const srmScoring = {
    structural: {
      "0": { description: "No action required", criteria: "Pipe observed in acceptable structural and service condition", action_required: "No action required", adoptable: true },
      "1": { description: "Excellent structural condition", criteria: "No defects observed", action_required: "None", adoptable: true },
      "2": { description: "Minor defects", criteria: "Some minor wear or joint displacement", action_required: "No immediate action", adoptable: true },
      "3": { description: "Moderate deterioration", criteria: "Isolated fractures, minor infiltration", action_required: "Medium-term repair or monitoring", adoptable: true },
      "4": { description: "Significant deterioration", criteria: "Multiple fractures, poor alignment, heavy infiltration", action_required: "Consider near-term repair", adoptable: false },
      "5": { description: "Severe structural failure", criteria: "Collapse, deformation, major cracking", action_required: "Immediate repair or replacement", adoptable: false }
    },
    service: {
      "0": { description: "No action required", criteria: "Pipe observed in acceptable structural and service condition", action_required: "No action required", adoptable: true },
      "1": { description: "No service issues", criteria: "Free flowing, no obstructions or deposits", action_required: "None", adoptable: true },
      "2": { description: "Minor service impacts", criteria: "Minor settled deposits or water levels", action_required: "Routine monitoring", adoptable: true },
      "3": { description: "Moderate service defects", criteria: "Partial blockages, 5–20% cross-sectional loss", action_required: "Desilting or cleaning recommended", adoptable: true },
      "4": { description: "Major service defects", criteria: "Severe deposits, 20–50% loss, significant flow restriction", action_required: "Cleaning or partial repair", adoptable: false },
      "5": { description: "Blocked or non-functional", criteria: "Over 50% flow loss or complete blockage", action_required: "Immediate action required", adoptable: false }
    }
  };
  
  const gradeKey = Math.min(grade, 5).toString();
  return srmScoring[type][gradeKey] || srmScoring.service["1"];
}

// REV_V1: Fixed file upload configuration to preserve database files
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Allow PDF and database files - improved validation
    const fileName = file.originalname.toLowerCase();
    const allowedExtensions = ['.pdf', '.db', '.db3', '.sqlite', '.sqlite3'];
    
    // Check for standard extensions or meta.db3
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext)) || 
                              fileName.endsWith('meta.db3') ||
                              fileName.endsWith('_meta.db3');
    
    if (hasValidExtension) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedExtensions.join(', ')}, meta.db3`));
    }
  }
});

// In-memory storage for folders (REV_V1 simulation)
let folderStorage = [
  {
    id: 1,
    folderName: "ECL NEWARK - Bowbridge Lane",
    projectAddress: "Bowbridge Lane, Newark, NG24 3BX",
    projectPostcode: "NG24 3BX",
    projectNumber: "ECL NEWARK",
    addressValidated: true,
    createdAt: "2025-01-08T07:30:00Z",
    updatedAt: "2025-01-08T07:30:00Z"
  },
  {
    id: 2,
    folderName: "Cromwell Road, CB1 3EG",
    projectAddress: "Cromwell Road, CB1 3EG",
    projectPostcode: "CB1 3EG",
    projectNumber: "CROMWELL_TEST",
    addressValidated: true,
    createdAt: "2025-07-10T18:17:24.288Z",
    updatedAt: "2025-07-10T18:17:24.288Z"
  }
];

// In-memory storage for uploads (REV_V1 simulation) - empty since 218 ECL was deleted
let uploadsStorage = [];

export async function registerRoutes(app: Express): Promise<Server> {
  
  // REV_V1: Simple authentication for test users
  app.get('/api/auth/user', (req, res) => {
    // Simple test user authentication
    res.json({
      id: "test-user",
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      profileImageUrl: null
    });
  });

  app.post('/api/admin/make-me-test-user', (req, res) => {
    // Simple test user creation
    res.json({ success: true, message: "Test user access granted" });
  });

  // REV_V1: Essential endpoints for frontend functionality
  app.get('/api/uploads', async (req, res) => {
    try {
      const uploads = await storage.getFileUploadsByUser("test-user");
      // Filter out component files from display (like Meta.db3 that are processed as part of combined sets)
      const visibleUploads = uploads.filter(upload => upload.status !== 'component');
      res.json(visibleUploads);
    } catch (error) {
      console.error('Error fetching uploads:', error);
      res.json([]);
    }
  });

  app.delete('/api/uploads/:id', async (req, res) => {
    try {
      const uploadId = parseInt(req.params.id);
      
      // Get upload info first
      const upload = await storage.getFileUploadById(uploadId);
      if (!upload) {
        return res.status(404).json({ error: 'Upload not found' });
      }
      
      // Delete physical file
      const fs = await import('fs');
      try {
        if (upload.filePath && fs.existsSync(upload.filePath)) {
          fs.unlinkSync(upload.filePath);
          console.log(`🗑️ Deleted physical file: ${upload.filePath}`);
        }
      } catch (fileError) {
        console.warn(`Could not delete file ${upload.filePath}:`, fileError.message);
      }
      
      // Remove from in-memory storage
      uploadsStorage = uploadsStorage.filter(u => u.id !== uploadId);
      
      // Use database storage to delete the upload (this also deletes associated sections)
      await storage.deleteFileUpload(uploadId);
      
      console.log(`✅ Upload ${uploadId} completely deleted: database records, sections, and physical file`);
      
      res.json({ success: true, message: 'Upload and all associated data deleted successfully' });
    } catch (error) {
      console.error('Error deleting upload:', error);
      res.status(500).json({ error: 'Failed to delete upload: ' + error.message });
    }
  });

  app.get('/api/folders', async (req, res) => {
    try {
      // Use database storage instead of in-memory storage
      const folders = await storage.getProjectFolders("test-user");
      res.json(folders);
    } catch (error) {
      console.error('Error fetching folders:', error);
      res.status(500).json({ error: 'Failed to fetch folders' });
    }
  });

  app.post('/api/folders', async (req, res) => {
    try {
      // Create new folder with proper data structure
      const newFolder = {
        userId: "test-user",
        folderName: req.body.projectAddress || req.body.folderName || "New Folder",
        projectAddress: req.body.projectAddress || req.body.folderName || "New Folder",
        projectPostcode: req.body.projectPostcode || "",
        projectNumber: req.body.projectNumber || "",
        travelDistance: req.body.travelDistance || null,
        travelTime: req.body.travelTime || null,
        addressValidated: req.body.addressValidated || false
      };
      
      const created = await storage.createProjectFolder(newFolder);
      
      console.log('Created new folder:', created);
      
      res.json(created);
    } catch (error) {
      console.error('Error creating folder:', error);
      res.status(500).json({ error: 'Failed to create folder' });
    }
  });

  app.delete('/api/folders/:id', async (req, res) => {
    try {
      const folderId = parseInt(req.params.id);
      
      // Get uploads in this folder before deletion to clean up physical files
      const uploadsInFolder = await storage.getFileUploadsByFolder(folderId);
      
      // Delete physical files
      const fs = await import('fs');
      for (const upload of uploadsInFolder) {
        try {
          if (upload.filePath && fs.existsSync(upload.filePath)) {
            fs.unlinkSync(upload.filePath);
            console.log(`🗑️ Deleted physical file: ${upload.filePath}`);
          }
        } catch (fileError) {
          console.warn(`Could not delete file ${upload.filePath}:`, fileError.message);
        }
      }
      
      // Delete folder and all associated data
      const result = await storage.deleteProjectFolder(folderId);
      
      // Also remove from in-memory storage
      uploadsStorage = uploadsStorage.filter(upload => 
        !uploadsInFolder.some(folderUpload => folderUpload.id === upload.id)
      );
      
      console.log(`✅ Folder ${folderId} completely deleted: ${result.deletedCounts.uploads} uploads, ${result.deletedCounts.sections} sections`);
      
      res.json({ 
        success: true, 
        message: 'Folder and all associated data deleted successfully',
        folderName: result.folderName,
        deletedCounts: result.deletedCounts
      });
    } catch (error) {
      console.error('Error deleting folder:', error);
      res.status(500).json({ 
        error: 'Failed to delete folder: ' + error.message,
        details: {
          folderId: parseInt(req.params.id),
          error: error.message
        }
      });
    }
  });

  // Address autocomplete endpoint
  app.get('/api/addresses/search', async (req, res) => {
    const query = req.query.q as string;
    
    if (!query || query.length < 2) {
      return res.json([]);
    }
    
    try {
      // For now, return basic addresses
      // In production, this would call OS Places API or similar
      const basicAddresses = [
        "40 Hollow Road - Bury St Edmunds - IP32 7AY",
        "Bowbridge Lane, Newark, NG24 3BX",
        "High Street, Birmingham, B4 7SL",
        "Victoria Street, Manchester, M3 1GA",
        "Church Street, Liverpool, L1 3AX",
        "Station Road, Leeds, LS1 4DY",
        "Queen Street, Sheffield, S1 2DX",
        "King Street, Newcastle, NE1 1HP",
        "Market Street, Bristol, BS1 2AA",
        "Park Road, Leicester, LE1 5TD"
      ];
      
      const filtered = basicAddresses.filter(addr => 
        addr.toLowerCase().includes(query.toLowerCase())
      );
      
      res.json(filtered.slice(0, 10));
    } catch (error) {
      console.error('Address search error:', error);
      
      // Fallback to basic search
      const basicAddresses = [
        "40 Hollow Road - Bury St Edmunds - IP32 7AY",
        "Bowbridge Lane, Newark, NG24 3BX",
        "High Street, Birmingham, B4 7SL",
        "Victoria Street, Manchester, M3 1GA",
        "Church Street, Liverpool, L1 3AX",
        "Station Road, Leeds, LS1 4DY",
        "Queen Street, Sheffield, S1 2DX",
        "King Street, Newcastle, NE1 1HP",
        "Market Street, Bristol, BS1 2AA",
        "Park Road, Leicester, LE1 5TD"
      ];
      
      const filtered = basicAddresses.filter(addr => 
        addr.toLowerCase().includes(query.toLowerCase())
      );
      
      res.json(filtered.slice(0, 10));
    }
  });

  // Legacy endpoints (placeholder only)
  app.get('/api/equipment-types/:id', (req, res) => {
    res.json([]);
  });

  app.get('/api/user-pricing', (req, res) => {
    res.json([]);
  });

  // Dashboard API endpoints for sections and defects
  app.get('/api/uploads/:id/sections', async (req, res) => {
    try {
      const uploadId = parseInt(req.params.id);
      const sections = await storage.getSectionsByUpload(uploadId);
      res.json(sections);
    } catch (error) {
      console.error('Error fetching sections:', error);
      res.status(500).json({ error: 'Failed to fetch sections' });
    }
  });

  app.get('/api/uploads/:id/defects', async (req, res) => {
    try {
      const uploadId = parseInt(req.params.id);
      // For now, return empty array as defects are included in sections
      res.json([]);
    } catch (error) {
      console.error('Error fetching defects:', error);
      res.status(500).json({ error: 'Failed to fetch defects' });
    }
  });

  // Legacy PR2 endpoints completely removed - now using /api/pr2-clean exclusively

  // Standard Categories API endpoints
  app.get('/api/standard-categories', async (req, res) => {
    try {
      const categories = await db
        .select()
        .from(standardCategories)
        .where(eq(standardCategories.isActive, true));
      
      console.log(`✅ Loading ${categories.length} standard categories from database`);
      res.json(categories);
    } catch (error) {
      console.error('Error fetching standard categories:', error);
      res.status(500).json({ error: 'Failed to fetch standard categories' });
    }
  });

  app.post('/api/standard-categories', async (req, res) => {
    try {
      const { categoryName, description } = req.body;
      console.log('📝 Creating new standard category:', { categoryName, description });
      
      // Generate categoryId from categoryName
      const categoryId = categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      const newCategory = await db
        .insert(standardCategories)
        .values({
          categoryId,
          categoryName,
          description,
          iconName: 'Settings',
          isDefault: false,
          isActive: true
        })
        .returning();
      
      console.log('✅ Created standard category:', newCategory[0]);
      res.json(newCategory[0]);
    } catch (error) {
      console.error('Error creating standard category:', error);
      res.status(500).json({ error: 'Failed to create standard category' });
    }
  });

  app.delete('/api/standard-categories/:categoryId', async (req, res) => {
    try {
      const categoryId = req.params.categoryId;
      console.log('🗑️ Deleting standard category:', categoryId);
      
      // Check if category has any PR2 configurations
      const existingConfigs = await db
        .select()
        .from(pr2Configurations)
        .where(eq(pr2Configurations.categoryId, categoryId));
      
      if (existingConfigs.length > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete category with existing pricing configurations. Please delete the pricing configurations first.' 
        });
      }
      
      // Delete the category by setting isActive to false
      const deletedCategory = await db
        .update(standardCategories)
        .set({ isActive: false })
        .where(eq(standardCategories.categoryId, categoryId))
        .returning();
      
      if (deletedCategory.length === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      console.log('✅ Deleted standard category:', deletedCategory[0]);
      res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Error deleting standard category:', error);
      res.status(500).json({ error: 'Failed to delete standard category' });
    }
  });

  // Sector standards endpoints
  app.get('/api/standards/:sector', (req, res) => {
    try {
      const sectorStandards = getSectorStandards(req.params.sector);
      if (sectorStandards) {
        res.json(sectorStandards);
      } else {
        res.status(404).json({ error: 'Sector not found' });
      }
    } catch (error) {
      console.error('Error fetching sector standards:', error);
      res.status(500).json({ error: 'Failed to fetch standards' });
    }
  });

  app.get('/api/standards', (req, res) => {
    try {
      const allStandards = getAllSectorStandards();
      res.json(allStandards);
    } catch (error) {
      console.error('Error fetching all standards:', error);
      res.status(500).json({ error: 'Failed to fetch standards' });
    }
  });

  // File upload endpoint
  app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
      const { sector, folderId } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileName = req.file.originalname;
      const filePath = req.file.path;
      const fileSize = req.file.size;
      
      console.log(`📁 File uploaded: ${fileName} (${fileSize} bytes)`);
      
      // Create upload record
      const uploadData = {
        userId: "test-user",
        fileName,
        filePath,
        fileSize,
        sector: sector || 'utilities',
        folderId: folderId ? parseInt(folderId) : null,
        status: 'uploaded'
      };

      const upload = await storage.createFileUpload(uploadData);
      
      // Process file based on type
      if (fileName.toLowerCase().endsWith('.db3') || fileName.toLowerCase().endsWith('.db')) {
        // Process Wincan database file
        const sections = await readWincanDatabase(filePath);
        if (sections && sections.length > 0) {
          await storeWincanSections(upload.id, sections);
          await storage.updateFileUpload(upload.id, { status: 'completed' });
          console.log(`✅ Processed ${sections.length} sections from Wincan database`);
        }
      }

      res.json(upload);
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Upload failed: ' + error.message });
    }
  });

  // Section data endpoint
  app.get('/api/sections/:uploadId', async (req, res) => {
    try {
      const uploadId = parseInt(req.params.uploadId);
      const sections = await storage.getSectionsByUpload(uploadId);
      res.json(sections);
    } catch (error) {
      console.error('Error fetching sections:', error);
      res.status(500).json({ error: 'Failed to fetch sections' });
    }
  });

  const server = createServer(app);
  return server;
}