import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { pr2Configurations, standardCategories } from "../shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { getSectorStandards } from "./sector-standards";

// Legacy routes function - still needed for server startup
export async function registerRoutes(app: Express): Promise<Server> {
  
  // Simple authentication for test users
  app.get('/api/auth/user', (req, res) => {
    res.json({
      id: "test-user",
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      profileImageUrl: null
    });
  });

  // Sections endpoint for dashboard data
  app.get("/api/sections", async (req, res) => {
    try {
      const userId = req.query.userId as string || "test-user";
      
      // Import the necessary tables
      const { sectionInspections, fileUploads } = await import("@shared/schema");
      
      // Get all section inspections for the user
      const sections = await db.select()
        .from(sectionInspections)
        .innerJoin(fileUploads, eq(sectionInspections.fileUploadId, fileUploads.id))
        .where(and(
          eq(fileUploads.userId, userId),
          eq(fileUploads.status, "completed")
        ))
        .orderBy(desc(sectionInspections.id));
      
      // Format the response data
      const formattedSections = sections.map(row => ({
        id: row.section_inspections.id,
        fileUploadId: row.section_inspections.fileUploadId,
        itemNo: row.section_inspections.itemNo,
        letterSuffix: row.section_inspections.letterSuffix,
        projectNo: row.section_inspections.projectNo,
        startMH: row.section_inspections.startMH,
        finishMH: row.section_inspections.finishMH,
        pipeSize: row.section_inspections.pipeSize,
        pipeMaterial: row.section_inspections.pipeMaterial,
        totalLength: row.section_inspections.totalLength,
        defects: row.section_inspections.defects,
        defectType: row.section_inspections.defectType,
        severityGrade: row.section_inspections.severityGrade,
        severityGrades: row.section_inspections.severityGrades,
        recommendations: row.section_inspections.recommendations,
        adoptable: row.section_inspections.adoptable,
        cost: row.section_inspections.cost,
        sector: row.file_uploads.sector,
        fileName: row.file_uploads.fileName,
        projectNumber: row.file_uploads.projectNumber
      }));
      
      res.json(formattedSections);
    } catch (error) {
      console.error("Error fetching sections:", error);
      res.status(500).json({ error: "Failed to fetch sections" });
    }
  });

  // Standard categories endpoint
  app.get('/api/standard-categories', async (req, res) => {
    try {
      const categories = await db
        .select()
        .from(standardCategories);
      

      res.json(categories);
    } catch (error) {
      console.error('Error fetching standard categories:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });

  // Generate standard description based on category name and sector standards
  const generateStandardDescription = (categoryName: string): string => {
    const name = categoryName.toLowerCase();
    
    // Get utilities sector standards for description consistency
    const utilitiesStandards = getSectorStandards('utilities');
    const baseStandards = utilitiesStandards?.standards || [];
    
    // Category-specific descriptions based on WRc and industry standards
    const categoryDescriptions: Record<string, string> = {
      'patching': 'Localized pipe repair and patching services according to WRc Drain Repair Book standards',
      'lining': 'Pipe lining installation services compliant with WRc Drain Rehabilitation Manual',
      'relining': 'Structural pipe relining services following WRc and MSCC5 standards',
      'excavation': 'Traditional excavation and repair services per WRc Drain Repair Book guidelines',
      'cctv': 'Closed-circuit television inspection services according to WRc standards',
      'cleaning': 'Drain and sewer cleaning services per WRc Drain & Sewer Cleaning Manual',
      'jetting': 'High-pressure water jetting services following WRc cleaning standards',
      'tankering': 'Waste removal and tankering services compliant with industry standards',
      'cutting': 'Precision cutting services according to WRc technical guidelines',
      'inspection': 'Comprehensive inspection services per MSCC5 and WRc standards'
    };
    
    // Find matching description based on category name keywords
    for (const [key, description] of Object.entries(categoryDescriptions)) {
      if (name.includes(key)) {
        return description;
      }
    }
    
    // Default description referencing WRc standards
    return `${categoryName} services compliant with WRc Group standards and industry best practices`;
  };

  // F-Series auto-numbering function
  const getNextFSeriesNumber = async (): Promise<number> => {
    // Known F-series assignments
    const knownFSeries = [606, 608, 611, 612, 614, 615, 619, 620, 621, 622, 623, 624];
    
    // Get all existing categories to check for any existing F-series numbers
    const existingCategories = await db
      .select()
      .from(standardCategories);
    
    // Extract F-numbers from existing category names
    const existingFNumbers = existingCategories
      .map(cat => {
        const match = cat.categoryName?.match(/^F(\d+)/);
        return match ? parseInt(match[1]) : null;
      })
      .filter(num => num !== null);
    
    // Combine known and existing F-numbers, then find the next available
    const allUsedNumbers = [...new Set([...knownFSeries, ...existingFNumbers])].sort((a, b) => a - b);
    
    // Find the next available F-number starting from F625
    let nextNumber = 625;
    while (allUsedNumbers.includes(nextNumber)) {
      nextNumber++;
    }
    
    return nextNumber;
  };

  // POST endpoint for creating standard categories with auto F-series numbering
  app.post('/api/standard-categories', async (req, res) => {
    try {
      const { categoryName, description } = req.body;
      
      if (!categoryName) {
        return res.status(400).json({ error: 'Category name is required' });
      }

      // Generate category ID from name (lowercase, hyphenated)
      const categoryId = categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      
      // Check if category already exists
      const existingCategory = await db
        .select()
        .from(standardCategories)
        .where(eq(standardCategories.categoryId, categoryId));
      
      if (existingCategory.length > 0) {
        return res.status(409).json({ error: 'Category already exists' });
      }

      // Use original category name without F-series prefix (F-numbers handled by DevLabels)
      const finalCategoryName = categoryName;
      
      // Auto-generate description if not provided
      const finalDescription = description || generateStandardDescription(finalCategoryName);

      // Insert new category with F-series number
      const newCategory = await db
        .insert(standardCategories)
        .values({
          categoryId,
          categoryName: finalCategoryName
        })
        .returning();

      res.json(newCategory[0]);
    } catch (error) {
      console.error('Error creating standard category:', error);
      res.status(500).json({ error: 'Failed to create category' });
    }
  });



  const httpServer = createServer(app);
  return httpServer;
}

// Clean PR2 Routes - Completely separate from legacy systems
export async function registerCleanPR2Routes(app: Express): Promise<void> {
  
  // GET all clean PR2 configurations
  app.get('/api/pr2-clean', async (req, res) => {
    try {
      const sector = req.query.sector as string;
      const categoryId = req.query.categoryId as string;
      
      // Helper function to generate P-number for categoryId lookups
      const generatePNumber = (categoryId: string, sector: string): string => {
        const P_NUMBER_MAPPING = {
          'utilities': { 
            'cctv': 'P012', 
            'cctv-jet-vac': 'P006', 
            'cctv-van-pack': 'P008', 
            'patching': 'P015',
            'jet-vac': 'P010',
            'van-pack': 'P011',
            'directional-water-cutter': 'P014',
            'ambient-lining': 'P020',
            'hot-cure-lining': 'P021',
            'uv-lining': 'P022',
            'excavation': 'P023',
            'tankering': 'P024'
          },
          'adoption': { 
            'cctv': 'P112', 
            'cctv-jet-vac': 'P106', 
            'cctv-van-pack': 'P108', 
            'patching': 'P115',
            'jet-vac': 'P110',
            'van-pack': 'P111',
            'directional-water-cutter': 'P114',
            'ambient-lining': 'P120',
            'hot-cure-lining': 'P121',
            'uv-lining': 'P122',
            'excavation': 'P123',
            'tankering': 'P124'
          },
          'highways': { 
            'cctv': 'P212', 
            'cctv-jet-vac': 'P206', 
            'cctv-van-pack': 'P208', 
            'patching': 'P215',
            'jet-vac': 'P210',
            'van-pack': 'P211',
            'directional-water-cutter': 'P214',
            'ambient-lining': 'P220',
            'hot-cure-lining': 'P221',
            'uv-lining': 'P222',
            'excavation': 'P223',
            'tankering': 'P224'
          },
          'insurance': { 
            'cctv': 'P312', 
            'cctv-jet-vac': 'P306', 
            'cctv-van-pack': 'P308', 
            'patching': 'P315',
            'jet-vac': 'P310',
            'van-pack': 'P311',
            'directional-water-cutter': 'P314',
            'ambient-lining': 'P320',
            'hot-cure-lining': 'P321',
            'uv-lining': 'P322',
            'excavation': 'P323',
            'tankering': 'P324'
          },
          'construction': { 
            'cctv': 'P412', 
            'cctv-jet-vac': 'P406', 
            'cctv-van-pack': 'P408', 
            'patching': 'P415',
            'jet-vac': 'P410',
            'van-pack': 'P411',
            'directional-water-cutter': 'P414',
            'ambient-lining': 'P420',
            'hot-cure-lining': 'P421',
            'uv-lining': 'P422',
            'excavation': 'P423',
            'tankering': 'P424'
          },
          'domestic': { 
            'cctv': 'P512', 
            'cctv-jet-vac': 'P506', 
            'cctv-van-pack': 'P508', 
            'patching': 'P515',
            'jet-vac': 'P510',
            'van-pack': 'P511',
            'directional-water-cutter': 'P514',
            'ambient-lining': 'P520',
            'hot-cure-lining': 'P521',
            'uv-lining': 'P522',
            'excavation': 'P523',
            'tankering': 'P524'
          }
        };

        // Get P-number for this sector and category, or fallback to original categoryId
        const sectorMapping = P_NUMBER_MAPPING[sector as keyof typeof P_NUMBER_MAPPING];
        return sectorMapping?.[categoryId as keyof typeof sectorMapping] || categoryId;
      };
      
      // Map frontend sector names to database sector names (A1-F16 system)
      const sectorMapping: Record<string, string> = {
        'utilities': 'utilities',
        'adoption': 'adoption', 
        'highways': 'highways',
        'insurance': 'insurance',
        'construction': 'construction',
        'domestic': 'domestic'
      };
      
      // API request logging removed
      
      let configurations;
      if (sector && categoryId) {
        // Map frontend sector name to database sector ID
        const databaseSectorId = sectorMapping[sector] || sector;
        
        console.log('🔍 Backend PR2 Config Lookup:', {
          requestedSector: sector,
          requestedCategoryId: categoryId,
          databaseSectorId: databaseSectorId,
          willQuery: `userId=system, categoryId=${categoryId}, sector=${databaseSectorId}`
        });
        
        // Filter by userId, sector, and categoryId using BOTH mapped sector ID AND original sector name
        // This handles the transition period where some configs use 'utilities' and others use 'id1'
        try {
          configurations = await db
            .select()
            .from(pr2Configurations)
            .where(and(
              eq(pr2Configurations.userId, "system"),
              eq(pr2Configurations.categoryId, categoryId),
              // Query BOTH the mapped sector (id1) AND the original sector (utilities)
              sql`(${pr2Configurations.sector} = ${databaseSectorId} OR ${pr2Configurations.sector} = ${sector})`
            ));
          
          // Prioritize original sector name over mapped sector ID (utilities over id1)
          // This ensures A5 (ID 760, utilities) takes priority over duplicates
          configurations.sort((a, b) => {
            if (a.sector === sector && b.sector !== sector) return -1;
            if (b.sector === sector && a.sector !== sector) return 1;
            return a.id - b.id; // Secondary sort by ID (lower IDs first)
          });
          
          console.log('🔍 DUAL SECTOR QUERY RESULTS:', {
            requestedSector: sector,
            totalFound: configurations.length,
            sectors: configurations.map(c => c.sector),
            ids: configurations.map(c => c.id),
            prioritizedConfig: configurations[0]?.id,
            prioritizedSector: configurations[0]?.sector
          });
        } catch (queryError) {
          console.error('Query error details:', queryError);
          throw queryError;
        }
      } else if (categoryId) {
        // Filter by userId and categoryId only (search all sectors for this category)
        // Filtering logging removed
        configurations = await db
          .select()
          .from(pr2Configurations)
          .where(and(
            eq(pr2Configurations.userId, "system"),
            eq(pr2Configurations.categoryId, categoryId)
          ));
      } else if (sector) {
        // Filter by both userId and sector using single sector field

        configurations = await db
          .select()
          .from(pr2Configurations)
          .where(and(
            eq(pr2Configurations.userId, "system"),
            eq(pr2Configurations.sector, sector)
          ));

      } else {
        // If no sector specified, return all configurations for user
        // Filtering logging removed
        configurations = await db
          .select()
          .from(pr2Configurations)
          .where(eq(pr2Configurations.userId, "system"));
      }
      
      // Query result logging removed
      
      res.json(configurations);
    } catch (error) {
      console.error('Error fetching clean PR2 configurations:', error);
      
      // Check if it's a database connection error and provide fallback
      if (error && (error as any).code === 'XX000' && (error as any).message?.includes('endpoint has been disabled')) {
        console.log('🔄 Database unavailable, using fallback configurations');
        const { FALLBACK_CONFIGURATIONS } = await import('./fallback-data');
        
        const requestedSector = req.query.sector as string;
        const requestedCategoryId = req.query.categoryId as string;
        
        // Filter fallback configurations based on request
        let filteredConfigs = FALLBACK_CONFIGURATIONS;
        
        if (requestedSector) {
          filteredConfigs = filteredConfigs.filter(config => config.sector === requestedSector);
        }
        
        if (requestedCategoryId) {
          filteredConfigs = filteredConfigs.filter(config => config.categoryId === requestedCategoryId);
        }
        
        console.log(`🔄 Returning ${filteredConfigs.length} fallback configurations for sector: ${requestedSector}, category: ${requestedCategoryId}`);
        return res.json(filteredConfigs);
      }
      
      res.status(500).json({ error: 'Failed to fetch configurations' });
    }
  });

  // GET configurations by category with pipe size filtering
  app.get('/api/pr2-clean/category/:categoryId', async (req, res) => {
    try {
      const categoryId = req.params.categoryId;
      const pipeSize = req.query.pipeSize as string;
      
      // Build query conditions
      let whereConditions = and(
        eq(pr2Configurations.userId, "system"),
        eq(pr2Configurations.categoryId, categoryId)
      );
      
      // Add pipe size filter if provided
      if (pipeSize) {
        whereConditions = and(
          whereConditions,
          eq(pr2Configurations.pipeSize, pipeSize)
        );
      }
      
      const configurations = await db
        .select()
        .from(pr2Configurations)
        .where(whereConditions)
        .orderBy(desc(pr2Configurations.id)); // Most recent first
      
      res.json(configurations);
    } catch (error) {
      console.error('Error fetching configurations by category:', error);
      res.status(500).json({ error: 'Failed to fetch configurations' });
    }
  });

  // MSCC5 standard pipe sizes for auto-detection
  const MSCC5_PIPE_SIZES = [
    '100', '150', '200', '225', '300', '375', 
    '450', '525', '600', '675', '750', '900', 
    '1050', '1200', '1500'
  ];

  // DISABLED: Auto-generation removed - use F615 for all patching
  app.post('/api/pr2-clean/auto-detect-pipe-size', async (req, res) => {
    try {
      // Return F615 for all patching requests - no auto-generation
      res.json({ id: 615, message: 'Using F615 for all patching configurations' });
      return;
      

      
      // This code is unreachable due to early return above, but keeping for reference
      const pipeSize = "150"; // placeholder
      const categoryId = "patching"; // placeholder  
      const sector = "utilities"; // placeholder
      
      // Validate pipe size is MSCC5 standard
      if (!MSCC5_PIPE_SIZES.includes(pipeSize)) {
        return res.status(400).json({ error: `Pipe size ${pipeSize}mm is not a valid MSCC5 standard size` });
      }
      
      // Check if configuration already exists
      const [existingConfig] = await db
        .select()
        .from(pr2Configurations)
        .where(and(
          eq(pr2Configurations.userId, "test-user"),
          eq(pr2Configurations.categoryId, categoryId),
          eq(pr2Configurations.pipeSize, pipeSize),
          eq(pr2Configurations.sector, sector)
        ));
      
      if (existingConfig) {

        return res.json(existingConfig);
      }
      
      // Find base configuration for this category to copy structure
      const [baseConfig] = await db
        .select()
        .from(pr2Configurations)
        .where(and(
          eq(pr2Configurations.userId, "test-user"),
          eq(pr2Configurations.categoryId, categoryId),
          eq(pr2Configurations.sector, sector)
        ))
        .orderBy(desc(pr2Configurations.id)); // Get most recent
      
      // Create category name with pipe size
      let categoryName;
      if (baseConfig) {
        // Extract base name and add pipe size
        const baseName = baseConfig.categoryName.replace(/\d+mm\s*/, '').replace(/^(TP\d+\s*-\s*)?/, '');
        const tpPrefix = baseConfig.categoryName.match(/^(TP\d+\s*-\s*)?/)?.[0] || '';
        categoryName = `${tpPrefix}${pipeSize}mm ${baseName}`;
      } else {
        categoryName = `${pipeSize}mm Configuration`;
      }
      
      // Create new configuration with auto-assigned ID
      const [newConfig] = await db
        .insert(pr2Configurations)
        .values({
          userId: "test-user",
          categoryId,
          categoryName,
          pipeSize,
          description: `Auto-generated ${pipeSize}mm configuration`,
          sector,
          categoryColor: baseConfig?.categoryColor || '#93c5fd',
          // Copy structure from base config if available
          pricingOptions: baseConfig?.pricingOptions || [],
          quantityOptions: baseConfig?.quantityOptions || [],
          minQuantityOptions: baseConfig?.minQuantityOptions || [],
          rangeOptions: baseConfig?.rangeOptions || [],
          vehicleTravelRates: baseConfig?.vehicleTravelRates || [],
          vehicleTravelRatesStackOrder: baseConfig?.vehicleTravelRatesStackOrder || [],
          isActive: true
        } as any)
        .returning();
      

      res.json(newConfig);
    } catch (error) {
      console.error('Error auto-detecting pipe size configuration:', error);
      res.status(500).json({ error: 'Failed to auto-create pipe size configuration' });
    }
  });

  // GET single clean PR2 configuration
  app.get('/api/pr2-clean/:id', async (req, res) => {
    try {
      const configId = parseInt(req.params.id);
      // GET request logging removed
      
      const [configuration] = await db
        .select()
        .from(pr2Configurations)
        .where(eq(pr2Configurations.id, configId));
      
      if (!configuration) {
        // Configuration not found logging removed
        return res.status(404).json({ error: 'Configuration not found' });
      }
      
      // Configuration loading logging removed
      
      res.json(configuration);
    } catch (error) {
      console.error('Error fetching clean PR2 configuration:', error);
      res.status(500).json({ error: 'Failed to fetch configuration' });
    }
  });

  // POST create new clean PR2 configuration
  app.post('/api/pr2-clean', async (req, res) => {
    try {
      // POST request logging removed
      
      const {
        categoryName,
        description,
        pricingOptions,
        quantityOptions,
        minQuantityOptions,
        rangeOptions,
        additionalOptions,
        mathOperators,
        pricingStackOrder,
        quantityStackOrder,
        minQuantityStackOrder,
        rangeStackOrder,
        vehicleTravelRates,
        vehicleTravelRatesStackOrder,
        sector,
        sectors,
        categoryColor,
        mmData
      } = req.body;

      // Generate sector-specific P-number for categoryId to ensure data isolation
      const generatePNumber = (categoryId: string, sector: string): string => {
        const P_NUMBER_MAPPING = {
          'utilities': { 
            'cctv': 'P012', 
            'cctv-jet-vac': 'P006', 
            'cctv-van-pack': 'P008', 
            'patching': 'P015',
            'jet-vac': 'P010',
            'van-pack': 'P011',
            'directional-water-cutter': 'P014',
            'ambient-lining': 'P020',
            'hot-cure-lining': 'P021',
            'uv-lining': 'P022',
            'excavation': 'P023',
            'tankering': 'P024'
          },
          'adoption': { 
            'cctv': 'P112', 
            'cctv-jet-vac': 'P106', 
            'cctv-van-pack': 'P108', 
            'patching': 'P115',
            'jet-vac': 'P110',
            'van-pack': 'P111',
            'directional-water-cutter': 'P114',
            'ambient-lining': 'P120',
            'hot-cure-lining': 'P121',
            'uv-lining': 'P122',
            'excavation': 'P123',
            'tankering': 'P124'
          },
          'highways': { 
            'cctv': 'P212', 
            'cctv-jet-vac': 'P206', 
            'cctv-van-pack': 'P208', 
            'patching': 'P215',
            'jet-vac': 'P210',
            'van-pack': 'P211',
            'directional-water-cutter': 'P214',
            'ambient-lining': 'P220',
            'hot-cure-lining': 'P221',
            'uv-lining': 'P222',
            'excavation': 'P223',
            'tankering': 'P224'
          },
          'insurance': { 
            'cctv': 'P312', 
            'cctv-jet-vac': 'P306', 
            'cctv-van-pack': 'P308', 
            'patching': 'P315',
            'jet-vac': 'P310',
            'van-pack': 'P311',
            'directional-water-cutter': 'P314',
            'ambient-lining': 'P320',
            'hot-cure-lining': 'P321',
            'uv-lining': 'P322',
            'excavation': 'P323',
            'tankering': 'P324'
          },
          'construction': { 
            'cctv': 'P412', 
            'cctv-jet-vac': 'P406', 
            'cctv-van-pack': 'P408', 
            'patching': 'P415',
            'jet-vac': 'P410',
            'van-pack': 'P411',
            'directional-water-cutter': 'P414',
            'ambient-lining': 'P420',
            'hot-cure-lining': 'P421',
            'uv-lining': 'P422',
            'excavation': 'P423',
            'tankering': 'P424'
          },
          'domestic': { 
            'cctv': 'P512', 
            'cctv-jet-vac': 'P506', 
            'cctv-van-pack': 'P508', 
            'patching': 'P515',
            'jet-vac': 'P510',
            'van-pack': 'P511',
            'directional-water-cutter': 'P514',
            'ambient-lining': 'P520',
            'hot-cure-lining': 'P521',
            'uv-lining': 'P522',
            'excavation': 'P523',
            'tankering': 'P524'
          }
        };

        // Get P-number for this sector and category, or fallback to original categoryId
        const sectorMapping = P_NUMBER_MAPPING[sector as keyof typeof P_NUMBER_MAPPING];
        return sectorMapping?.[categoryId as keyof typeof sectorMapping] || categoryId;
      };

      const sectorSpecificCategoryId = generatePNumber(req.body.categoryId || "clean-" + Date.now(), sector || 'utilities');

      const [newConfig] = await db
        .insert(pr2Configurations)
        .values({
          userId: "test-user",
          categoryId: sectorSpecificCategoryId, // Use P-number instead of raw categoryId
          categoryName: categoryName || 'New Clean Configuration',
          pipeSize: req.body.pipeSize || '150', // Default to 150mm if not specified
          description: description || 'Clean PR2 configuration',
          sector: sector || 'utilities', // Single sector per configuration
          categoryColor: categoryColor || '#ffffff', // Default white color - user must assign color
          pricingOptions: pricingOptions || [],
          quantityOptions: quantityOptions || [],
          minQuantityOptions: minQuantityOptions || [],
          rangeOptions: rangeOptions || [],
          rangeValues: {},
          mathOperators: mathOperators || ['N/A'],
          vehicleTravelRates: vehicleTravelRates || [],
          vehicleTravelRatesStackOrder: vehicleTravelRatesStackOrder || [],
          mmData: mmData || {},
          isActive: true
        } as any)
        .returning();


      res.json(newConfig);
    } catch (error) {
      console.error('Error creating clean PR2 configuration:', error);
      res.status(500).json({ error: 'Failed to create configuration' });
    }
  });

  // PUT update clean PR2 configuration
  app.put('/api/pr2-clean/:id', async (req, res) => {
    try {
      const configId = parseInt(req.params.id);
      
      const {
        categoryName,
        description,
        pricingOptions,
        quantityOptions,
        minQuantityOptions,
        rangeOptions,
        additionalOptions,
        mathOperators,
        pricingStackOrder,
        quantityStackOrder,
        minQuantityStackOrder,
        rangeStackOrder,
        vehicleTravelRates,
        vehicleTravelRatesStackOrder,
        sector,
        sectors,
        categoryColor,
        mmData
      } = req.body;

      const [updatedConfig] = await db
        .update(pr2Configurations)
        .set({
          categoryName: categoryName || 'Updated Clean Configuration',
          pipeSize: req.body.pipeSize, // Update pipe size if provided
          description: description || 'Clean PR2 configuration',
          sector: sector || 'utilities', // Single sector per configuration
          categoryColor: categoryColor, // Use the provided color
          pricingOptions: pricingOptions || [],
          quantityOptions: quantityOptions || [],
          minQuantityOptions: minQuantityOptions || [],
          rangeOptions: rangeOptions || [],
          rangeValues: {},
          mathOperators: mathOperators || ['N/A'],
          vehicleTravelRates: vehicleTravelRates || [],
          vehicleTravelRatesStackOrder: vehicleTravelRatesStackOrder || [],
          mmData: mmData || {},
          updatedAt: new Date()
        } as any)
        .where(eq(pr2Configurations.id, configId))
        .returning();

      if (!updatedConfig) {
        return res.status(404).json({ error: 'Configuration not found' });
      }

      res.json(updatedConfig);
    } catch (error) {
      console.error('Error updating clean PR2 configuration:', error);
      res.status(500).json({ error: 'Failed to update configuration' });
    }
  });

  // DELETE clean PR2 configuration - PROTECTED WITH USER CONFIRMATION
  app.delete('/api/pr2-clean/:id', async (req, res) => {
    try {
      const configId = parseInt(req.params.id);
      const { userConfirmed } = req.body; // Require explicit user confirmation
      
      // CRITICAL: Require explicit user confirmation to prevent data loss
      if (!userConfirmed) {
        return res.status(400).json({ 
          error: 'DELETION BLOCKED: User confirmation required',
          configId: configId,
          message: 'This deletion requires explicit user approval to prevent accidental data loss'
        });
      }

      // Get configuration details before deletion for audit logging
      const existingConfig = await db.select()
        .from(pr2Configurations)
        .where(eq(pr2Configurations.id, configId))
        .limit(1);

      if (existingConfig.length === 0) {
        return res.status(404).json({ error: 'Configuration not found' });
      }

      // Log deletion for audit trail
      // Configuration deletion logged

      const [deletedConfig] = await db
        .delete(pr2Configurations)
        .where(eq(pr2Configurations.id, configId))
        .returning();

      res.json({ 
        message: 'Configuration deleted successfully',
        deletedConfig: deletedConfig
      });
    } catch (error) {
      console.error('Error deleting clean PR2 configuration:', error);
      res.status(500).json({ error: 'Failed to delete configuration' });
    }
  });
}