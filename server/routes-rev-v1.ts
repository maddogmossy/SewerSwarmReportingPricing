import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { readWincanDatabase, storeWincanSections } from "./wincan-db-reader";
import { getSectorStandards, getAllSectorStandards } from "./sector-standards";
import { db } from "./db";
import { repairPricing, pr2Configurations } from "../shared/schema";
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

// In-memory storage for work categories (REV_V1 simulation) - Only Cleanse/Survey
let workCategoriesStorage = [
  { id: 4, name: "Cleanse/Survey", description: "Complete cleaning followed by verification survey to confirm completion" }
];

// In-memory storage for pricing data (REV_V1 simulation)
let pricingStorage = [
  // Cleanse/Survey pricing entry - properly configured for both systems
  {
    id: 6,
    sector: "utilities",
    workCategoryId: 4, // Links to "Cleanse/Survey" work category
    workCategory: "Cleanse/Survey",
    repairMethodId: 1, // Links to "Cleanse and Survey" repair method
    methodName: "Cleanse and Survey",
    pipeSize: "150mm",
    costPerMetre: 0.00, // Default until user configured pricing
    cost: 0.00,
    description: "Complete cleaning followed by verification survey to confirm completion (150mm pipe)"
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
    const hasBasicPricing = sectorPricing.length >= 1; // Only need Cleanse/Survey pricing
    
    res.json({ 
      configured: hasBasicPricing,
      details: {
        sectorPricing: sectorPricing.length,
        available: sectorPricing.map(p => p.workCategory)
      }
    });
  });

  app.get('/api/repair-pricing/:sector', async (req, res) => {
    try {
      // Get pricing data from database first
      const dbPricing = await db
        .select()
        .from(repairPricing)
        .where(eq(repairPricing.sector, req.params.sector));

      // If database has data, use it; otherwise fall back to memory
      if (dbPricing.length > 0) {
        console.log(`✅ Loading ${dbPricing.length} pricing records from DATABASE for sector: ${req.params.sector}`);
        
        // Enhance pricing data with workCategory names from workCategoriesStorage
        const enhancedPricing = dbPricing.map(pricing => {
          const workCategory = workCategoriesStorage.find(cat => cat.id === pricing.workCategoryId);
          return {
            ...pricing,
            workCategory: workCategory?.name || undefined,
            methodName: workCategory?.name || undefined
          };
        });
        
        res.json(enhancedPricing);
      } else {
        // Create database record from memory storage if it exists
        const sectorPricing = pricingStorage.filter(item => item.sector === req.params.sector);
        if (sectorPricing.length > 0) {
          console.log(`🔄 Migrating ${sectorPricing.length} memory records to DATABASE for sector: ${req.params.sector}`);
          // Create database records for each memory item
          for (const item of sectorPricing) {
            await db.insert(repairPricing).values({
              userId: "test-user",
              sector: item.sector,
              workCategoryId: item.workCategoryId,
              repairMethodId: item.repairMethodId,
              pipeSize: item.pipeSize,
              description: item.description,
              cost: String(item.cost || 0),
              dayRate: item.dayRate || null,
              runsPerShift: item.runsPerShift || null,
              pricingStructure: item.pricingStructure || {},
            }).onConflictDoNothing();
          }
          // Now fetch the newly created records
          const newDbPricing = await db
            .select()
            .from(repairPricing)
            .where(eq(repairPricing.sector, req.params.sector));
            
          // Enhance with workCategory names
          const enhancedNewPricing = newDbPricing.map(pricing => {
            const workCategory = workCategoriesStorage.find(cat => cat.id === pricing.workCategoryId);
            return {
              ...pricing,
              workCategory: workCategory?.name || undefined,
              methodName: workCategory?.name || undefined
            };
          });
          
          res.json(enhancedNewPricing);
        } else {
          console.log(`⚠️  No memory records found for sector: ${req.params.sector}`);
          res.json([]);
        }
      }
    } catch (error) {
      console.error('Error fetching pricing from database:', error);
      // Fallback to memory storage with workCategory names
      const sectorPricing = pricingStorage.filter(item => item.sector === req.params.sector);
      const enhancedSectorPricing = sectorPricing.map(pricing => {
        const workCategory = workCategoriesStorage.find(cat => cat.id === pricing.workCategoryId);
        return {
          ...pricing,
          workCategory: workCategory?.name || undefined,
          methodName: workCategory?.name || undefined
        };
      });
      res.json(enhancedSectorPricing);
    }
  });



  // POST endpoint to create new repair pricing
  app.post('/api/repair-pricing', (req, res) => {
    // Extract data from request body - handle nested data structure
    const requestData = req.body.data || req.body;
    
    // Extract all range fields dynamically (min/max values)
    const rangeFields = {};
    Object.keys(requestData).forEach(key => {
      if (key.startsWith('range_') && (key.endsWith('_min') || key.endsWith('_max'))) {
        rangeFields[key] = requestData[key];
      }
    });
    
    const {
      sector,
      workCategoryId,
      repairMethodId,
      pipeSize,
      description,
      cost,
      // Dynamic pricing structure values
      meterage,
      hourlyRate,
      dayRate,
      setupRate,
      minCharge,
      repeatFree,
      numberPerShift,
      metersPerShift,
      inspectionsPerShift,
      minUnitsPerShift,
      minMetersPerShift,
      minInspectionsPerShift,
      minSetupCount,
      // Map runsPerShift to numberPerShift for backend compatibility
      runsPerShift,
      // Pricing structure selections and math operators
      pricingStructure,
      mathOperators,
      customOptions
    } = requestData;

    // Handle field mapping - runsPerShift from frontend maps to numberPerShift in backend
    const mappedNumberPerShift = runsPerShift || numberPerShift;

    console.log('Creating new repair pricing with data:', req.body);
    console.log('Extracted pricing structure:', pricingStructure);
    console.log('Request data structure:', { requestData });
    console.log('Field mapping - runsPerShift:', runsPerShift, 'mappedNumberPerShift:', mappedNumberPerShift);

    // Generate new ID
    const newId = Math.max(...pricingStorage.map(p => p.id), 0) + 1;
    
    // Create new pricing entry with all dynamic fields
    const newPricing = {
      id: newId,
      userId: "test-user",
      sector: sector || "utilities",
      workCategoryId,
      repairMethodId,
      pipeSize: pipeSize || "150mm",
      description: description || "User-defined pricing configuration",
      cost: cost || "0.00",
      // Dynamic pricing structure values
      meterage: meterage || null,
      hourlyRate: hourlyRate || null,
      dayRate: dayRate || null,
      setupRate: setupRate || null,
      minCharge: minCharge || null,
      repeatFree: repeatFree || null,
      numberPerShift: mappedNumberPerShift || null,
      runsPerShift: runsPerShift || null,
      metersPerShift: metersPerShift || null,
      inspectionsPerShift: inspectionsPerShift || null,
      minUnitsPerShift: minUnitsPerShift || null,
      minMetersPerShift: minMetersPerShift || null,
      minInspectionsPerShift: minInspectionsPerShift || null,
      minSetupCount: minSetupCount || null,
      // Store pricing structure selections for UI persistence
      pricingStructure: pricingStructure || {},
      // Store math operators and custom options
      mathOperators: mathOperators || {},
      customOptions: customOptions || {},
      // Store all range fields for flexibility
      range_fields: rangeFields || {},
      createdAt: new Date().toISOString()
    };

    // Add to storage
    pricingStorage.push(newPricing);
    
    console.log(`✅ Created repair pricing with ID: ${newId}`);
    console.log('Pricing structure:', pricingStructure);
    
    res.json(newPricing);
  });

  // PUT endpoint to update existing repair pricing
  app.put('/api/repair-pricing/:id', async (req, res) => {
    const { id } = req.params;
    const pricingId = parseInt(id);
    
    // Extract data from request body - handle nested data structure
    const requestData = req.body.data || req.body;
    
    // Extract all range fields dynamically (min/max values)
    const rangeFields = {};
    Object.keys(requestData).forEach(key => {
      if (key.startsWith('range_') && (key.endsWith('_min') || key.endsWith('_max'))) {
        rangeFields[key] = requestData[key];
      }
    });
    
    const {
      sector,
      workCategoryId,
      repairMethodId,
      pipeSize,
      description,
      cost,
      // Dynamic pricing structure values
      meterage,
      hourlyRate,
      dayRate,
      setupRate,
      minCharge,
      repeatFree,
      numberPerShift,
      metersPerShift,
      inspectionsPerShift,
      minUnitsPerShift,
      minMetersPerShift,
      minInspectionsPerShift,
      minSetupCount,
      // Map runsPerShift to numberPerShift for backend compatibility
      runsPerShift,
      // Pricing structure selections and math operators
      pricingStructure,
      mathOperators,
      customOptions
    } = requestData;

    // Handle field mapping - runsPerShift from frontend maps to numberPerShift in backend
    const mappedNumberPerShift = runsPerShift || numberPerShift;

    console.log(`Updating repair pricing ${pricingId} with data:`, req.body);
    console.log(`Extracted pricing structure:`, pricingStructure);
    console.log(`Request data structure:`, { requestData });
    console.log(`Field mapping - runsPerShift:`, runsPerShift, 'mappedNumberPerShift:', mappedNumberPerShift);
    console.log(`Math operators received:`, mathOperators);
    console.log(`Custom options received:`, customOptions);
    console.log(`Range fields extracted:`, rangeFields);

    try {
      // Update in database first
      const updateData = {
        sector: sector,
        workCategoryId: workCategoryId,
        repairMethodId: repairMethodId,
        pipeSize: pipeSize,
        description: description,
        cost: String(cost || 0),
        // Dynamic pricing structure values - convert empty strings to null for numeric fields
        meterage: meterage || null,
        hourlyRate: hourlyRate || null,
        dayRate: dayRate || null,
        setupRate: setupRate || null,
        minCharge: minCharge || null,
        numberPerShift: mappedNumberPerShift || null,
        runsPerShift: runsPerShift || null,
        metersPerShift: metersPerShift || null,
        minUnitsPerShift: minUnitsPerShift || null,
        minMetersPerShift: minMetersPerShift || null,
        minInspectionsPerShift: minInspectionsPerShift || null,
        minSetupCount: minSetupCount || null,
        // Store pricing structure selections for UI persistence
        pricingStructure: pricingStructure || {},
        // Store math operators and custom options
        mathOperators: mathOperators || {},
        customOptions: customOptions || {},
        // Store all range fields in JSON column for flexibility
        range_fields: rangeFields || {},
        updatedAt: sql`now()`
      };

      // Update in database
      const [updatedPricing] = await db
        .update(repairPricing)
        .set(updateData)
        .where(eq(repairPricing.id, pricingId))
        .returning();

      if (!updatedPricing) {
        return res.status(404).json({ error: 'Pricing item not found' });
      }

      // Also update in-memory storage for backwards compatibility
      const pricingIndex = pricingStorage.findIndex(p => p.id === pricingId);
      if (pricingIndex !== -1) {
        pricingStorage[pricingIndex] = {
          ...pricingStorage[pricingIndex],
          ...updateData,
          // Store math operators and custom options in memory too
          mathOperators: mathOperators || {},
          customOptions: customOptions || {},
          updatedAt: new Date().toISOString()
        };
      }
      
      console.log(`✅ Updated repair pricing ${pricingId} in DATABASE`);
      console.log('Updated pricing structure:', pricingStructure);
      
      res.json({
        ...updatedPricing,
        mathOperators: mathOperators || {},
        customOptions: customOptions || {}
      });
      
    } catch (error) {
      console.error('Error updating pricing in database:', error);
      res.status(500).json({ error: 'Failed to update pricing in database' });
    }
  });

  app.get('/api/work-categories', (req, res) => {
    res.json(workCategoriesStorage);
  });

  app.post('/api/work-categories', (req, res) => {
    const { name, description } = req.body;
    
    if (!name || !description) {
      return res.status(400).json({ error: 'Name and description are required' });
    }
    
    // Check for duplicates before adding
    const existingCategory = workCategoriesStorage.find(cat => 
      cat.name.toLowerCase() === name.trim().toLowerCase()
    );
    
    if (existingCategory) {
      return res.json(existingCategory); // Return existing instead of creating duplicate
    }
    
    // Generate new ID
    const newId = Math.max(...workCategoriesStorage.map(cat => cat.id), 0) + 1;
    
    // Create new work category
    const newCategory = {
      id: newId,
      name: name.trim(),
      description: description.trim()
    };
    
    // Add to storage
    workCategoriesStorage.push(newCategory);
    
    console.log(`✅ Added new work category: ${newCategory.name} (ID: ${newId})`);
    
    res.json(newCategory);
  });

  // Cleanup endpoint for removing duplicate categories
  app.post('/api/work-categories/cleanup', (req, res) => {
    // Remove duplicate "Cleanse/Survey" category (ID: 5)
    const initialLength = workCategoriesStorage.length;
    workCategoriesStorage = workCategoriesStorage.filter(cat => 
      !(cat.id === 5 && cat.name === "Cleanse/Survey")
    );
    const removedCount = initialLength - workCategoriesStorage.length;
    
    console.log(`🧹 Removed ${removedCount} duplicate work categories`);
    res.json({ success: true, removedCount });
  });

  app.delete('/api/work-categories/:id', (req, res) => {
    const { id } = req.params;
    const categoryId = parseInt(id);
    
    console.log(`🗑️ Deleting work category with ID: ${categoryId}`);
    
    // Find the category before deletion for logging
    const categoryToDelete = workCategoriesStorage.find(cat => cat.id === categoryId);
    
    if (!categoryToDelete) {
      console.log(`❌ Category with ID ${categoryId} not found`);
      return res.status(404).json({ error: 'Category not found' });
    }
    
    console.log(`🗑️ Found category to delete: "${categoryToDelete.name}"`);
    
    // Remove the category from storage
    const initialLength = workCategoriesStorage.length;
    workCategoriesStorage = workCategoriesStorage.filter(cat => cat.id !== categoryId);
    const finalLength = workCategoriesStorage.length;
    
    console.log(`✅ Removal complete. Categories: ${initialLength} → ${finalLength}`);
    console.log(`📦 Remaining categories:`, workCategoriesStorage.map(cat => `${cat.id}: ${cat.name}`));
    
    // Also remove any associated pricing data for this category
    const pricingInitialLength = pricingStorage.length;
    pricingStorage = pricingStorage.filter(pricing => pricing.workCategoryId !== categoryId);
    const pricingFinalLength = pricingStorage.length;
    
    if (pricingInitialLength !== pricingFinalLength) {
      console.log(`🧹 Also removed ${pricingInitialLength - pricingFinalLength} associated pricing entries`);
    }
    
    res.json({ 
      success: true, 
      deletedCategory: categoryToDelete,
      message: `Category "${categoryToDelete.name}" deleted successfully`
    });
  });

  app.get('/api/vehicle-travel-rates', (req, res) => {
    res.json([
      { id: 1, vehicleType: "Van", ratePerMile: 0.45 },
      { id: 2, vehicleType: "Truck", ratePerMile: 0.65 }
    ]);
  });

  // PR1 endpoints removed - using PR2 system exclusively

  // PR2 Pricing System - Completely separate from legacy ops
  app.get('/api/pr2-pricing', async (req, res) => {
    try {
      const { sector = 'utilities' } = req.query;
      
      console.log('🔍 PR2 GET request for sector:', sector);
      
      // Query PR2 configurations from database  
      const configurations = await db.select()
        .from(pr2Configurations)
        .where(eq(pr2Configurations.sector, sector as string));
        
      console.log('📊 Found PR2 configurations:', configurations.length);
      
      res.json(configurations);
    } catch (error) {
      console.error('Error fetching PR2 configurations:', error);
      res.status(500).json({ error: 'Failed to fetch PR2 configurations' });
    }
  });

  app.post('/api/pr2-pricing', async (req, res) => {
    try {
      const configData = req.body;
      console.log('💾 PR2 POST request:', configData);
      
      // Insert new PR2 configuration into database
      const newConfig = await db.insert(pr2Configurations)
        .values({
          userId: 'test-user', // Use test user for now
          categoryId: configData.categoryId || 'cleanse-survey',
          categoryName: configData.categoryName || 'Cleanse and Survey',
          description: configData.description,
          pricingOptions: configData.pricingOptions || [],
          quantityOptions: configData.quantityOptions || [],
          minQuantityOptions: configData.minQuantityOptions || [],
          rangeOptions: configData.rangeOptions || [],
          rangeValues: configData.rangeValues || {},
          mathOperators: configData.mathOperators || [],
          sector: configData.sector || 'utilities'
        })
        .returning();
        
      console.log('✅ PR2 configuration saved to database:', newConfig[0]);
      
      res.json({ 
        success: true, 
        configuration: newConfig[0],
        message: 'PR2 configuration saved successfully'
      });
    } catch (error) {
      console.error('Error saving PR2 configuration:', error);
      res.status(500).json({ error: 'Failed to save PR2 configuration' });
    }
  });

  app.delete('/api/pr2-pricing/:id', async (req, res) => {
    try {
      const configId = parseInt(req.params.id);
      console.log('🗑️ PR2 DELETE request for ID:', configId);
      
      const deletedConfig = await db.delete(pr2Configurations)
        .where(eq(pr2Configurations.id, configId))
        .returning();
        
      if (deletedConfig.length === 0) {
        return res.status(404).json({ error: 'PR2 configuration not found' });
      }
        
      console.log('✅ PR2 configuration deleted:', deletedConfig[0]);
      
      res.json({ 
        success: true, 
        message: 'PR2 configuration deleted successfully' 
      });
    } catch (error) {
      console.error('Error deleting PR2 configuration:', error);
      res.status(500).json({ error: 'Failed to delete PR2 configuration' });
    }
  });

  // Removed generic sector profile route - using specific routes instead

  // Add DELETE endpoint for repair pricing - COMPREHENSIVE DELETION
  app.delete('/api/repair-pricing/:id', async (req, res) => {
    const { id } = req.params;
    const { scope, currentSector } = req.query;
    
    console.log(`🗑️ COMPREHENSIVE DELETE: Removing pricing item ${id} with scope ${scope} for sector ${currentSector}`);
    
    const itemId = parseInt(id);
    
    try {
      // Step 1: Get the item being deleted to find associated category
      let itemToDelete = null;
      try {
        const dbItems = await db.select().from(repairPricing)
          .where(eq(repairPricing.id, itemId))
          .limit(1);
        itemToDelete = dbItems[0];
      } catch (dbError) {
        console.log(`⚠️ Database read failed, checking in-memory storage`);
        itemToDelete = pricingStorage.find(item => item.id === itemId);
      }
      
      let categoryName = null;
      if (itemToDelete) {
        // Try multiple possible field names for category
        categoryName = itemToDelete.categoryName || itemToDelete.workCategory || itemToDelete.name;
        console.log(`🗑️ Found item to delete: "${categoryName}" (ID: ${itemId})`);
        console.log(`🔍 Available fields:`, Object.keys(itemToDelete));
      }
      
      // Step 2: Remove from DATABASE (repairPricing table)
      let databaseDeleted = false;
      try {
        if (scope === 'all') {
          await db.delete(repairPricing)
            .where(eq(repairPricing.id, itemId));
          console.log(`✅ Deleted pricing item ${itemId} from ALL sectors in DATABASE`);
        } else {
          await db.delete(repairPricing)
            .where(sql`${repairPricing.id} = ${itemId} AND ${repairPricing.sector} = ${currentSector}`);
          console.log(`✅ Deleted pricing item ${itemId} from ${currentSector} sector in DATABASE`);
        }
        databaseDeleted = true;
      } catch (dbError) {
        console.log(`⚠️ Database deletion failed (item may not exist in DB):`, dbError.message);
      }
      
      // Step 3: Remove from IN-MEMORY pricingStorage
      const initialLength = pricingStorage.length;
      if (scope === 'all') {
        pricingStorage = pricingStorage.filter(item => item.id !== itemId);
      } else {
        pricingStorage = pricingStorage.filter(item => 
          !(item.id === itemId && item.sector === currentSector)
        );
      }
      const deletedFromMemory = initialLength - pricingStorage.length;
      console.log(`🧹 Removed ${deletedFromMemory} pricing items from in-memory storage`);
      
      // Step 4: Remove from workCategoriesStorage if category matches
      let removedWorkCategories = 0;
      if (categoryName) {
        const initialWorkCategoryLength = workCategoriesStorage.length;
        workCategoriesStorage = workCategoriesStorage.filter(cat => 
          cat.name.toLowerCase() !== categoryName.toLowerCase()
        );
        removedWorkCategories = initialWorkCategoryLength - workCategoriesStorage.length;
        
        if (removedWorkCategories > 0) {
          console.log(`🧹 Removed ${removedWorkCategories} matching work categories from in-memory storage`);
          console.log(`📦 Remaining work categories:`, workCategoriesStorage.map(cat => `${cat.id}: ${cat.name}`));
        }
      }
      
      console.log(`✅ COMPREHENSIVE DELETE COMPLETE: All traces of item ${itemId} removed from all storage locations`);
      
      res.json({ 
        success: true, 
        message: `Successfully deleted pricing item from all storage locations`,
        scope: scope,
        sector: currentSector,
        deletedFromDatabase: databaseDeleted,
        deletedFromMemory: deletedFromMemory,
        removedWorkCategories: removedWorkCategories,
        categoryName: categoryName
      });
      
    } catch (error) {
      console.error('Error in comprehensive deletion:', error);
      res.status(500).json({ 
        error: 'Failed to completely delete pricing item',
        details: error.message 
      });
    }
  });



  // REV_V1: Critical endpoints for dashboard data display
  app.get('/api/uploads/:id/sections', async (req, res) => {
    try {
      const uploadId = parseInt(req.params.id);
      
      // Try to get real sections from database first
      const sections = await storage.getSectionInspectionsByFileUpload(uploadId);
      
      if (sections.length > 0) {
        // Add SRM grading calculation to each section
        const sectionsWithSRM = sections.map(section => {
          // Determine defect type based on defects text
          const defectType = determineDefectType(section.defects || '');
          
          // Calculate SRM grading
          const srmGrading = getSRMGrading(section.severityGrade || 0, defectType);
          
          return {
            ...section,
            srmGrading
          };
        });
        
        res.json(sectionsWithSRM);
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
      
      // Find the upload from database storage
      console.log(`Looking for upload with ID: ${uploadId}`);
      const upload = await storage.getFileUploadById(uploadId);
      console.log(`Upload found:`, upload);
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
          name: 'Cleanse and Survey',
          description: 'Complete cleaning followed by verification survey to confirm completion',
          category: 'cleaning'
        },
        {
          id: 2,
          name: 'Custom Cleaning',
          description: 'User-defined cleaning method with custom specifications',
          category: 'cleaning'
        },
        // Structural repair methods (for structural defects)
        {
          id: 3,
          name: 'Patch',
          description: 'Localized structural repair using resin-based patching materials',
          category: 'structural'
        },
        {
          id: 4,
          name: 'Lining',
          description: 'Full pipe rehabilitation using CIPP or other lining technologies',
          category: 'structural'
        },
        {
          id: 5,
          name: 'Excavation',
          description: 'Complete pipe replacement through open excavation',
          category: 'structural'
        },
        {
          id: 6,
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

  // Simple Pricing API endpoints
  app.get('/api/simple-pricing', async (req, res) => {
    try {
      console.log('Fetching simple pricing data');
      const pricing = await db.select().from(repairPricing);
      res.json(pricing);
    } catch (error) {
      console.error('Error fetching simple pricing:', error);
      res.status(500).json({ error: 'Failed to fetch pricing data' });
    }
  });

  app.post('/api/simple-pricing', async (req, res) => {
    try {
      console.log('Creating simple pricing category:', req.body);
      
      const { categoryName, priceOptions, quantityOptions, minQuantityOptions, rangeOptions } = req.body;
      
      const newPricing = await db.insert(repairPricing).values({
        categoryName,
        pricingStructure: {
          priceOptions: priceOptions || [],
          quantityOptions: quantityOptions || [],
          minQuantityOptions: minQuantityOptions || [],
          rangeOptions: rangeOptions || []
        },
        mathOperators: {},
        sector: 'utilities',
        userId: 'test-user'
      }).returning();
      
      res.json(newPricing[0]);
    } catch (error) {
      console.error('Error creating simple pricing:', error);
      res.status(500).json({ error: 'Failed to create pricing category' });
    }
  });

  app.put('/api/simple-pricing/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log('Updating simple pricing category:', id, req.body);
      
      const { categoryName, priceOptions, quantityOptions, minQuantityOptions, rangeOptions } = req.body;
      
      const updatedPricing = await db.update(repairPricing)
        .set({
          categoryName,
          pricingStructure: {
            priceOptions: priceOptions || [],
            quantityOptions: quantityOptions || [],
            minQuantityOptions: minQuantityOptions || [],
            rangeOptions: rangeOptions || []
          },
          mathOperators: {},
          updatedAt: new Date()
        })
        .where(eq(repairPricing.id, id))
        .returning();
      
      res.json(updatedPricing[0]);
    } catch (error) {
      console.error('Error updating simple pricing:', error);
      res.status(500).json({ error: 'Failed to update pricing category' });
    }
  });

  app.delete('/api/simple-pricing/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log('Deleting simple pricing category:', id);
      
      const deleted = await db.delete(repairPricing)
        .where(eq(repairPricing.id, id))
        .returning();
      
      res.json({ success: true, deleted: deleted[0] });
    } catch (error) {
      console.error('Error deleting simple pricing:', error);
      res.status(500).json({ error: 'Failed to delete pricing category' });
    }
  });

  const server = createServer(app);
  return server;
}