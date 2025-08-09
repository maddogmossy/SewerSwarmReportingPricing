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
      
      // API request logging removed
      
      let configurations;
      if (sector && categoryId) {
        // Filter by userId, sector, and categoryId using single sector field
        // Filtering logging removed
        try {
          configurations = await db
            .select()
            .from(pr2Configurations)
            .where(and(
              eq(pr2Configurations.userId, "test-user"),
              eq(pr2Configurations.categoryId, categoryId),
              eq(pr2Configurations.sector, sector)
            ));
        } catch (queryError) {
          console.error('Query error details:', queryError);
          throw queryError;
        }
      } else if (categoryId) {
        // Filter by userId and categoryId only
        // Filtering logging removed
        configurations = await db
          .select()
          .from(pr2Configurations)
          .where(and(
            eq(pr2Configurations.userId, "test-user"),
            eq(pr2Configurations.categoryId, categoryId)
          ));
      } else if (sector) {
        // Filter by both userId and sector using single sector field

        configurations = await db
          .select()
          .from(pr2Configurations)
          .where(and(
            eq(pr2Configurations.userId, "test-user"),
            eq(pr2Configurations.sector, sector)
          ));

      } else {
        // If no sector specified, return all configurations for user
        // Filtering logging removed
        configurations = await db
          .select()
          .from(pr2Configurations)
          .where(eq(pr2Configurations.userId, "test-user"));
      }
      
      // Query result logging removed
      
      res.json(configurations);
    } catch (error) {
      console.error('Error fetching clean PR2 configurations:', error);
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
        eq(pr2Configurations.userId, "test-user"),
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

      const [newConfig] = await db
        .insert(pr2Configurations)
        .values({
          userId: "test-user",
          categoryId: req.body.categoryId || "clean-" + Date.now(),
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