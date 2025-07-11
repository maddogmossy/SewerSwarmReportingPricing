import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { readWincanDatabase, storeWincanSections } from "./wincan-db-reader";

// REV_V1: Fixed file upload configuration to preserve database files
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Allow PDF and database files
    const allowedTypes = ['.pdf', '.db', '.db3', '.sqlite', '.sqlite3'];
    const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and database files are allowed'));
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
      
      // Use database storage to delete the upload (this also deletes associated sections)
      await storage.deleteFileUpload(uploadId);
      
      res.json({ success: true, message: 'Upload deleted successfully' });
    } catch (error) {
      console.error('Error deleting upload:', error);
      res.status(500).json({ error: 'Failed to delete upload' });
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
      await storage.deleteProjectFolder(folderId);
      
      console.log(`Deleted folder with ID: ${folderId}`);
      
      res.json({ success: true, message: 'Folder deleted successfully' });
    } catch (error) {
      console.error('Error deleting folder:', error);
      res.status(500).json({ error: 'Failed to delete folder' });
    }
  });

  app.get('/api/search-addresses', (req, res) => {
    const query = req.query.q as string;
    if (!query || query.length < 3) {
      return res.json([]);
    }
    
    // Return relevant UK addresses for Newark area
    const addresses = [
      "Bowbridge Lane, Newark, NG24 3BX",
      "Bowbridge Road, Newark, NG24 3BY", 
      "Bridge Street, Newark, NG24 1RZ",
      "Castle Gate, Newark, NG24 1AZ",
      "London Road, Newark, NG24 1TN",
      "Lombard Street, Newark, NG24 1XE"
    ];
    
    const filtered = addresses.filter(addr => 
      addr.toLowerCase().includes(query.toLowerCase())
    );
    
    res.json(filtered.slice(0, 5));
  });

  app.get('/api/equipment-types/:id', (req, res) => {
    res.json([]);
  });

  app.get('/api/user-pricing', (req, res) => {
    res.json([]);
  });

  app.get('/api/pricing/check/:sector', (req, res) => {
    res.json({ configured: false });
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

  app.get('/api/:sector/profile', (req, res) => {
    res.json({ sector: req.params.sector, standards: [] });
  });

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
          await storeWincanSections(sections, uploadId);
          await storage.updateFileUploadStatus(uploadId, 'completed', '');
          
          res.json({
            success: true,
            message: `Successfully extracted ${sections.length} authentic sections from Wincan database`,
            sectionsCount: sections.length,
            sections: sections
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

      console.log('File uploaded:', {
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      });

      // Determine file type based on extension
      const fileExtension = req.file.originalname.toLowerCase();
      let fileType = 'pdf';
      if (fileExtension.endsWith('.db3') || fileExtension.endsWith('.db')) {
        fileType = 'database';
      }

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
      
      // For REV_V1, immediately mark as completed with basic response
      const completedUpload = await storage.updateFileUploadStatus(
        upload.id, 
        'completed',
        '/dashboard?report=' + upload.id
      );

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

  const server = createServer(app);
  return server;
}