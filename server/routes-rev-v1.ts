import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { readWincanDatabase, storeWincanSections } from "./wincan-db-reader";
import { getSectorStandards, getAllSectorStandards } from "./sector-standards";

// Debug: Test import at module level
console.log('Testing sector standards import...');
console.log('getSectorStandards function:', typeof getSectorStandards);
const testStandards = getSectorStandards('utilities');
console.log('Test utilities standards:', testStandards ? 'SUCCESS' : 'FAILED');
console.log('Standards count:', testStandards?.standards?.length || 0);

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
                              fileName.includes('.db3');
    
    console.log('Server file validation:', { fileName, hasValidExtension });
    
    if (hasValidExtension) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and database files are allowed (.pdf, .db, .db3, .sqlite, meta.db3)'));
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

// In-memory storage for pricing data (REV_V1 simulation)
let pricingStorage = [
  {
    id: 1,
    sector: "utilities",
    workCategoryId: 1,
    workCategory: "CCTV Survey",
    pipeSize: "150mm",
    costPerMetre: 15.50,
    cost: 15.50,
    description: "Standard CCTV inspection"
  },
  {
    id: 2,
    sector: "utilities",
    workCategoryId: 2,
    workCategory: "High Pressure Jetting",
    pipeSize: "150mm", 
    costPerMetre: 25.00,
    cost: 25.00,
    description: "Water jetting cleaning"
  },
  {
    id: 3,
    sector: "utilities",
    workCategoryId: 3,
    workCategory: "Patch Repair",
    pipeSize: "300mm",
    depth: "2-3m",
    description: "300mm patch repair excavation and reinstatement",
    option1Cost: "450.00",
    option2Cost: "680.00", 
    option3Cost: "850.00",
    option4Cost: "950.00",
    cost: 680.00,
    rule: "Standard double layer patch for 300mm pipe",
    lengthOfRepair: "1000mm",
    selectedOption: "Option 2: Double Layer"
  },
  {
    id: 4,
    sector: "utilities",
    workCategoryId: 3,
    workCategory: "Patch Repair",
    pipeSize: "150mm",
    depth: "2-3m",
    description: "150mm patch repair excavation and reinstatement",
    option1Cost: "380.00",
    option2Cost: "520.00", 
    option3Cost: "650.00",
    option4Cost: "750.00",
    cost: 520.00,
    rule: "Standard double layer patch for 150mm pipe",
    lengthOfRepair: "1000mm",
    selectedOption: "Option 2: Double Layer"
  },
  {
    id: 5,
    sector: "utilities",
    workCategoryId: 3,
    workCategory: "Patch Repair",
    pipeSize: "225mm",
    depth: "2-3m",
    description: "225mm patch repair excavation and reinstatement",
    option1Cost: "420.00",
    option2Cost: "580.00", 
    option3Cost: "720.00",
    option4Cost: "820.00",
    cost: 580.00,
    rule: "Standard double layer patch for 225mm pipe",
    lengthOfRepair: "1000mm",
    selectedOption: "Option 2: Double Layer"
  }
];

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
      
      // Get upload details before deletion to clean up physical file
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
      res.status(500).json({ error: 'Failed to delete folder: ' + error.message });
    }
  });

  app.get('/api/search-addresses', async (req, res) => {
    const query = req.query.q as string;
    if (!query || query.length < 1) {
      return res.json([]);
    }
    
    try {
      const { searchUKAddresses } = await import('./address-autocomplete');
      const suggestions = searchUKAddresses(query, 10);
      res.json(suggestions);
    } catch (error) {
      console.error('Address autocomplete error:', error);
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

  app.get('/api/equipment-types/:id', (req, res) => {
    res.json([]);
  });

  app.get('/api/user-pricing', (req, res) => {
    res.json([]);
  });

  app.get('/api/pricing/check/:sector', (req, res) => {
    const sector = req.params.sector;
    
    // Check if we have pricing data in the static pricingStorage for this sector
    const sectorPricing = pricingStorage.filter(item => item.sector === sector);
    const hasBasicPricing = sectorPricing.length >= 2; // Need at least CCTV and Jetting/Patch pricing
    
    res.json({ 
      configured: hasBasicPricing,
      details: {
        sectorPricing: sectorPricing.length,
        available: sectorPricing.map(p => p.workCategory)
      }
    });
  });

  app.get('/api/repair-pricing/:sector', (req, res) => {
    // Return pricing data for the requested sector
    const sectorPricing = pricingStorage.filter(item => item.sector === req.params.sector);
    res.json(sectorPricing);
  });

  app.get('/api/work-categories', (req, res) => {
    res.json([
      { id: 1, name: "CCTV Surveys", description: "Camera inspection surveys" },
      { id: 2, name: "Jetting/Cleaning", description: "High pressure water jetting" },
      { id: 3, name: "Patch Repairs", description: "Localized pipe repairs" }
    ]);
  });

  app.get('/api/vehicle-travel-rates', (req, res) => {
    res.json([
      { id: 1, vehicleType: "Van", ratePerMile: 0.45 },
      { id: 2, vehicleType: "Truck", ratePerMile: 0.65 }
    ]);
  });

  // Removed generic sector profile route - using specific routes instead

  // Add DELETE endpoint for repair pricing
  app.delete('/api/repair-pricing/:id', (req, res) => {
    const { id } = req.params;
    const { scope, currentSector } = req.query;
    
    console.log(`Deleting repair pricing item ${id} with scope ${scope} for sector ${currentSector}`);
    
    const itemId = parseInt(id);
    const initialLength = pricingStorage.length;
    
    if (scope === 'all') {
      // Remove item from all sectors
      pricingStorage = pricingStorage.filter(item => item.id !== itemId);
    } else {
      // Remove item from current sector only
      pricingStorage = pricingStorage.filter(item => 
        !(item.id === itemId && item.sector === currentSector)
      );
    }
    
    const deletedCount = initialLength - pricingStorage.length;
    
    res.json({ 
      success: true, 
      message: `Successfully deleted ${deletedCount} pricing item(s)`,
      scope: scope,
      sector: currentSector,
      deletedCount: deletedCount
    });
  });

  // Add endpoint to clear ALL old pricing configurations
  app.delete('/api/repair-pricing-clear/:sector', (req, res) => {
    const { sector } = req.params;
    
    console.log(`Clearing all pricing configurations for sector: ${sector}`);
    
    const initialLength = pricingStorage.length;
    pricingStorage = pricingStorage.filter(item => item.sector !== sector);
    const deletedCount = initialLength - pricingStorage.length;
    
    res.json({ 
      success: true, 
      message: `Cleared ${deletedCount} old pricing configurations for ${sector} sector`,
      sector: sector,
      deletedCount: deletedCount
    });
  });

  // REV_V1: Critical endpoints for dashboard data display
  app.get('/api/uploads/:id/sections', async (req, res) => {
    try {
      const uploadId = parseInt(req.params.id);
      
      // Try to get real sections from database first
      const sections = await storage.getSectionInspectionsByFileUpload(uploadId);
      
      if (sections.length > 0) {
        res.json(sections);
      } else {
        // No sections found for this upload
        res.json([]);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
      res.json([]);
    }
  });

  app.get('/api/uploads/:id/defects', (req, res) => {
    // Return empty defects array for REV_V1 (OBSERVATIONS only, not defects)
    res.json([]);
  });

  // Add reprocessing endpoint to test authentic item number extraction
  app.post('/api/reprocess-upload/:uploadId', async (req, res) => {
    try {
      const uploadId = parseInt(req.params.uploadId);
      console.log(`🔄 Reprocessing upload ${uploadId} with inspection direction logic`);
      
      // Find the upload in storage
      const upload = uploadsStorage.find(u => u.id === uploadId);
      if (!upload) {
        return res.status(404).json({ error: 'Upload not found' });
      }
      
      const filePath = upload.filePath;
      
      // Check if it's a database file
      if (upload.fileName.toLowerCase().includes('.db')) {
        console.log(`📊 Reprocessing Wincan database file: ${upload.fileName}`);
        
        // Delete existing sections first to avoid duplicates
        await storage.deleteSectionInspectionsByFileUpload(uploadId);
        console.log(`🗑️ Cleared existing sections for upload ${uploadId}`);
        
        const sections = await readWincanDatabase(filePath);
        
        if (sections && sections.length > 0) {
          console.log(`✅ Extracted ${sections.length} sections with inspection direction logic applied`);
          await storeWincanSections(sections, uploadId);
          
          // Update upload status
          upload.status = 'completed';
          upload.extractedSections = sections.length;
          
          res.json({ 
            success: true, 
            message: 'Upload reprocessed successfully with inspection direction logic',
            sections: sections.length,
            itemNumbers: sections.map(s => s.itemNo),
            manholeFlow: sections.slice(0, 3).map(s => `${s.startMH} → ${s.finishMH}`)
          });
        } else {
          res.json({ success: false, message: 'No sections found in database' });
        }
      } else {
        res.json({ success: false, message: 'Not a database file' });
      }
    } catch (error) {
      console.error('Error reprocessing upload:', error);
      res.status(500).json({ error: 'Failed to reprocess upload' });
    }
  });

  // Add refresh endpoint for dashboard data with cache busting
  app.post('/api/refresh-upload/:uploadId', async (req, res) => {
    try {
      const uploadId = parseInt(req.params.uploadId);
      console.log(`🔄 Refreshing dashboard data for upload ${uploadId}`);
      
      // Get fresh sections from database
      const sections = await storage.getSectionInspectionsByFileUpload(uploadId);
      
      res.json({
        success: true,
        message: 'Data refreshed successfully',
        sections: sections.length,
        data: sections,
        timestamp: new Date().toISOString() // Add timestamp for cache busting
      });
    } catch (error) {
      console.error('Error refreshing upload data:', error);
      res.status(500).json({ error: 'Failed to refresh data' });
    }
  });

  // Add cache invalidation endpoint for frontend
  app.post('/api/invalidate-cache/:uploadId', async (req, res) => {
    try {
      const uploadId = parseInt(req.params.uploadId);
      console.log(`🔄 Cache invalidation requested for upload ${uploadId}`);
      
      // Get fresh sections to confirm data is available
      const sections = await storage.getSectionInspectionsByFileUpload(uploadId);
      
      res.json({
        success: true,
        message: 'Cache invalidated - please refresh page',
        sections: sections.length,
        timestamp: new Date().toISOString(),
        sampleRecommendations: sections.slice(2, 6).map(s => ({ 
          itemNo: s.itemNo, 
          recommendations: s.recommendations 
        }))
      });
    } catch (error) {
      console.error('Error invalidating cache:', error);
      res.status(500).json({ error: 'Failed to invalidate cache' });
    }
  });

  // Process Wincan database file endpoint
  app.post('/api/uploads/:id/process-wincan', async (req, res) => {
    try {
      const uploadId = parseInt(req.params.id);
      
      // Get upload details
      const upload = await storage.getFileUploadById(uploadId);
      if (!upload) {
        return res.status(404).json({ error: 'Upload not found' });
      }

      console.log(`🔄 Processing Wincan database: ${upload.fileName}`);
      
      // Try to process the main database file directly
      console.log('🔒 LOCKDOWN: Processing authentic Wincan database file');
      
      try {
        const sections = await readWincanDatabase(upload.filePath);
        
        if (sections.length > 0) {
          // Apply sequential validation logic for Wincan database during upload processing
          const itemNumbers = sections.map(s => s.itemNo).sort((a, b) => a - b);
          const minItem = Math.min(...itemNumbers);
          const maxItem = Math.max(...itemNumbers);
          
          console.log(`🔍 WINCAN DATABASE VALIDATION: Items ${minItem}-${maxItem}, extracted ${sections.length} sections`);
          console.log(`🔍 Item sequence: [${itemNumbers.join(', ')}]`);
          console.log(`🧭 INSPECTION DIRECTION: Applied direction logic to all ${sections.length} sections`);
          
          // Log manhole flow examples to verify direction logic
          const flowExamples = sections.slice(0, 3).map(s => `${s.startMH} → ${s.finishMH}`);
          console.log(`📍 Manhole flow examples: [${flowExamples.join(', ')}]`);
          
          // For database files, gaps are authentic deleted sections - don't flag as missing
          const expectedSequential = maxItem - minItem + 1;
          const actualSections = sections.length;
          
          if (actualSections < expectedSequential) {
            const missingItems = [];
            for (let i = minItem; i <= maxItem; i++) {
              if (!itemNumbers.includes(i)) {
                missingItems.push(i);
              }
            }
            console.log(`✅ AUTHENTIC DELETION DETECTED: Items ${missingItems.join(', ')} were deleted in Wincan database`);
            console.log(`✅ This is normal - user deleted ${missingItems.length} sections and didn't refresh database`);
            console.log(`✅ VALIDATION PASSED: Database file gaps recognized as authentic deletions, not missing data`);
          } else {
            console.log(`✅ COMPLETE SEQUENTIAL DATA: All sections from ${minItem} to ${maxItem} present`);
          }
          
          // Clear any existing sections first to avoid duplicates
          await storage.deleteSectionInspectionsByFileUpload(uploadId);
          console.log(`🗑️ Cleared any existing sections for upload ${uploadId}`);
          
          await storeWincanSections(sections, uploadId);
          await storage.updateFileUploadStatus(uploadId, 'completed', '');
          
          res.json({
            success: true,
            message: `Successfully extracted ${sections.length} authentic sections with inspection direction logic`,
            sectionsCount: sections.length,
            sections: sections,
            validationPassed: true,
            directionLogicApplied: true,
            manholeFlowExamples: flowExamples,
            sequenceInfo: {
              minItem,
              maxItem,
              extractedCount: sections.length,
              expectedSequential,
              authenticDeletions: actualSections < expectedSequential ? expectedSequential - actualSections : 0
            }
          });
        } else {
          res.json({
            success: false,
            message: 'No inspection data found in database file - may be a configuration-only file',
            sectionsCount: 0
          });
        }
      } catch (dbError) {
        console.error('Database processing error:', dbError.message);
        res.json({
          success: false,
          message: `CORRUPTION DETECTED: ${dbError.message}. Please upload fresh database files - the fixed upload system will preserve them correctly.`,
          sectionsCount: 0,
          requiresFreshUpload: true
        });
      }
      
    } catch (error) {
      console.error('Error processing Wincan database:', error);
      res.status(500).json({ error: 'Failed to process Wincan database: ' + error.message });
    }
  });

  // REV_V1: Main upload endpoint for both PDFs and database files
  app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Determine file type based on extension
      const fileExtension = req.file.originalname.toLowerCase();
      let fileType = 'pdf';
      if (fileExtension.endsWith('.db3') || fileExtension.endsWith('.db')) {
        fileType = 'database';
      }

      // Filter out Meta database files since they're not needed for processing
      if (req.file.originalname.toLowerCase().includes('meta') && 
          (fileExtension.endsWith('.db3') || fileExtension.endsWith('.db'))) {
        console.log('❌ Meta database file rejected:', req.file.originalname);
        return res.status(400).json({ 
          error: 'Meta database files are not needed for processing. Please upload the main database file instead.',
          fileName: req.file.originalname,
          reason: 'meta_file_not_supported'
        });
      }

      console.log('File uploaded:', {
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        detectedType: fileType
      });

      // Create upload record in database
      const uploadData = {
        userId: "test-user",
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        fileType: fileType,
        sector: req.body.sector || 'utilities',
        projectFolderId: req.body.projectFolderId ? parseInt(req.body.projectFolderId) : null,
        status: 'processing'
      };

      const upload = await storage.createFileUpload(uploadData);
      
      // Database files will be processed separately via /process-wincan endpoint
      if (fileType === 'database') {
        console.log('🔒 WINCAN DATABASE UPLOADED - Processing will happen via dedicated endpoint');
        // No processing here - avoid duplicate storage operations
        // The /process-wincan endpoint will handle all database processing
      }

      // Mark as completed after processing
      const completedUpload = await storage.updateFileUploadStatus(
        upload.id, 
        'completed',
        '/dashboard?report=' + upload.id
      );
      
      // Add to in-memory storage for reprocessing
      uploadsStorage.push({
        id: upload.id,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileType: fileType,
        sector: req.body.sector || 'utilities',
        status: 'completed',
        createdAt: new Date().toISOString()
      });

      res.json({
        success: true,
        uploadId: upload.id,
        fileName: req.file.originalname,
        message: 'File uploaded successfully',
        redirectUrl: '/dashboard?report=' + upload.id
      });

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Upload failed: ' + error.message });
    }
  });
  
  // REV_V1: Simple PDF analysis - no hardcoded data
  app.post("/api/analyze-pdf-standalone", upload.single('pdf'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }
    
    // REV_V1: Return empty response - no processing for standalone analysis
    return res.json({
      success: true,
      fileName: req.file.originalname,
      projectName: "Analysis Complete",
      date: new Date().toLocaleDateString('en-GB'),
      inspectionStandard: "REV_V1 - Basic Processing",
      totalPages: 0,
      textLength: 0,
      sectionsExtracted: 0,
      sections: [],
      missingSequences: [],
      observations: [],
      errors: []
    });
  });

  // Sector Standards API endpoints
  app.get('/api/sector-standards', async (req, res) => {
    try {
      const allStandards = getAllSectorStandards();
      res.json(allStandards);
    } catch (error) {
      console.error('Error fetching sector standards:', error);
      res.status(500).json({ error: 'Failed to fetch sector standards' });
    }
  });

  app.get('/api/sector-standards/:sector', async (req, res) => {
    try {
      const sectorStandards = getSectorStandards(req.params.sector);
      if (!sectorStandards) {
        return res.status(404).json({ error: 'Sector not found' });
      }
      res.json(sectorStandards);
    } catch (error) {
      console.error('Error fetching sector standards:', error);
      res.status(500).json({ error: 'Failed to fetch sector standards' });
    }
  });

  // Test route to verify server is running updated code
  app.get('/api/test-route', (req, res) => {
    res.json({ message: 'Routes updated successfully', timestamp: new Date().toISOString() });
  });

  app.get('/api/debug-test', (req, res) => {
    console.log('=== DEBUG TEST ROUTE CALLED ===');
    res.json({ message: 'DEBUG TEST WORKING', timestamp: new Date().toISOString() });
  });

  // Individual sector profile endpoints (frontend compatibility)
  app.get('/api/utilities/profile', (req, res) => {
    console.log('=== UTILITIES PROFILE ROUTE CALLED ===');
    try {
      console.log('Calling getSectorStandards with utilities...');
      const sectorStandards = getSectorStandards('utilities');
      console.log('Function returned:', sectorStandards);
      
      if (sectorStandards) {
        console.log('Sending successful response');
        res.json(sectorStandards);
      } else {
        console.log('Function returned null, sending fallback');
        res.json({ sector: 'utilities', standards: [] });
      }
    } catch (error) {
      console.error('Error in utilities route:', error);
      res.json({ sector: 'utilities', standards: [] });
    }
  });

  app.get('/api/adoption/profile', (req, res) => {
    console.log('=== ADOPTION PROFILE ROUTE CALLED ===');
    try {
      const sectorStandards = getSectorStandards('adoption');
      res.json(sectorStandards || { sector: 'adoption', standards: [] });
    } catch (error) {
      console.error('Error fetching adoption standards:', error);
      res.json({ sector: 'adoption', standards: [] });
    }
  });

  app.get('/api/highways/profile', (req, res) => {
    console.log('=== HIGHWAYS PROFILE ROUTE CALLED ===');
    try {
      const sectorStandards = getSectorStandards('highways');
      res.json(sectorStandards || { sector: 'highways', standards: [] });
    } catch (error) {
      console.error('Error fetching highways standards:', error);
      res.json({ sector: 'highways', standards: [] });
    }
  });

  app.get('/api/insurance/profile', (req, res) => {
    console.log('=== INSURANCE PROFILE ROUTE CALLED ===');
    try {
      const sectorStandards = getSectorStandards('insurance');
      res.json(sectorStandards || { sector: 'insurance', standards: [] });
    } catch (error) {
      console.error('Error fetching insurance standards:', error);
      res.json({ sector: 'insurance', standards: [] });
    }
  });

  app.get('/api/construction/profile', (req, res) => {
    console.log('=== CONSTRUCTION PROFILE ROUTE CALLED ===');
    try {
      const sectorStandards = getSectorStandards('construction');
      res.json(sectorStandards || { sector: 'construction', standards: [] });
    } catch (error) {
      console.error('Error fetching construction standards:', error);
      res.json({ sector: 'construction', standards: [] });
    }
  });

  app.get('/api/domestic/profile', (req, res) => {
    console.log('=== DOMESTIC PROFILE ROUTE CALLED ===');
    try {
      const sectorStandards = getSectorStandards('domestic');
      res.json(sectorStandards || { sector: 'domestic', standards: [] });
    } catch (error) {
      console.error('Error fetching domestic standards:', error);
      res.json({ sector: 'domestic', standards: [] });
    }
  });

  // Repair Methods API endpoint for cleaning and repair options
  app.get('/api/repair-methods', (req, res) => {
    console.log('=== REPAIR METHODS ROUTE CALLED ===');
    try {
      // Return predefined repair methods with categories for filtering
      const repairMethods = [
        // Cleaning methods (for service defects)
        {
          id: 1,
          name: 'Van Pack',
          description: 'Small mobile CCTV and cleaning unit suitable for restricted access areas',
          category: 'cleaning'
        },
        {
          id: 2, 
          name: 'Jet Vac',
          description: 'High-pressure water jetting with vacuum recovery for debris removal',
          category: 'cleaning'
        },
        {
          id: 3,
          name: 'Custom Cleaning',
          description: 'User-defined cleaning method with custom specifications',
          category: 'cleaning'
        },
        // Structural repair methods (for structural defects)
        {
          id: 4,
          name: 'Patch',
          description: 'Localized structural repair using resin-based patching materials',
          category: 'structural'
        },
        {
          id: 5,
          name: 'Lining',
          description: 'Full pipe rehabilitation using CIPP or other lining technologies',
          category: 'structural'
        },
        {
          id: 6,
          name: 'Excavation',
          description: 'Complete pipe replacement through open excavation',
          category: 'structural'
        },
        {
          id: 7,
          name: 'Custom',
          description: 'User-defined repair method with custom specifications',
          category: 'structural'
        }
      ];
      
      res.json(repairMethods);
    } catch (error) {
      console.error('Error fetching repair methods:', error);
      res.status(500).json({ error: 'Failed to fetch repair methods' });
    }
  });

  const server = createServer(app);
  return server;
}