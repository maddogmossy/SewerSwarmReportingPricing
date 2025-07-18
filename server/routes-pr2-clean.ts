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
      
      console.log(`✅ Loading ${categories.length} standard categories from database`);
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

  // POST endpoint for creating standard categories
  app.post('/api/standard-categories', async (req, res) => {
    try {
      const { categoryName, description } = req.body;
      
      if (!categoryName) {
        return res.status(400).json({ error: 'Category name is required' });
      }

      // Generate category ID from name (lowercase, hyphenated)
      const categoryId = categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      
      // Auto-generate description if not provided
      const finalDescription = description || generateStandardDescription(categoryName);
      
      // Check if category already exists
      const existingCategory = await db
        .select()
        .from(standardCategories)
        .where(eq(standardCategories.categoryId, categoryId));
      
      if (existingCategory.length > 0) {
        return res.status(409).json({ error: 'Category already exists' });
      }

      // Insert new category
      const newCategory = await db
        .insert(standardCategories)
        .values({
          categoryId,
          categoryName,
          description: finalDescription,
          iconName: 'Edit', // Default icon
          isDefault: true,
          isActive: true
        })
        .returning();

      console.log(`✅ Created new standard category: ${categoryName} (ID: ${categoryId})`);
      console.log(`📝 Auto-generated description: ${finalDescription}`);
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
      
      console.log(`🔍 API request received for sector: ${sector}, categoryId: ${categoryId}`);
      
      let configurations;
      if (sector && categoryId) {
        // Filter by userId, sector, and categoryId using single sector field
        console.log(`🔍 Filtering by userId: "test-user", sector: "${sector}", AND categoryId: "${categoryId}"`);
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
        console.log(`🔍 Filtering by userId: "test-user" AND categoryId: "${categoryId}"`);
        configurations = await db
          .select()
          .from(pr2Configurations)
          .where(and(
            eq(pr2Configurations.userId, "test-user"),
            eq(pr2Configurations.categoryId, categoryId)
          ));
      } else if (sector) {
        // Filter by both userId and sector using single sector field
        console.log(`🔍 Filtering by userId: "test-user" AND sector: "${sector}"`);
        configurations = await db
          .select()
          .from(pr2Configurations)
          .where(and(
            eq(pr2Configurations.userId, "test-user"),
            eq(pr2Configurations.sector, sector)
          ));
      } else {
        // If no sector specified, return all configurations for user
        console.log(`🔍 Filtering by userId: "test-user" only (no sector filter)`);
        configurations = await db
          .select()
          .from(pr2Configurations)
          .where(eq(pr2Configurations.userId, "test-user"));
      }
      
      console.log(`✅ Query returned ${configurations.length} configurations`);
      if (configurations.length > 0) {
        console.log(`📊 Configuration details:`, configurations.map(c => `ID: ${c.id}, Sector: ${c.sector}`));
      }
      
      res.json(configurations);
    } catch (error) {
      console.error('Error fetching clean PR2 configurations:', error);
      res.status(500).json({ error: 'Failed to fetch configurations' });
    }
  });

  // GET configurations by category
  app.get('/api/pr2-clean/category/:categoryId', async (req, res) => {
    try {
      const categoryId = req.params.categoryId;
      console.log(`🔍 API request for category: ${categoryId}`);
      
      const configurations = await db
        .select()
        .from(pr2Configurations)
        .where(and(
          eq(pr2Configurations.userId, "test-user"),
          eq(pr2Configurations.categoryId, categoryId)
        ))
        .orderBy(desc(pr2Configurations.id)); // Most recent first
      
      console.log(`✅ Found ${configurations.length} configurations for category ${categoryId}`);
      res.json(configurations);
    } catch (error) {
      console.error('Error fetching configurations by category:', error);
      res.status(500).json({ error: 'Failed to fetch configurations' });
    }
  });

  // GET single clean PR2 configuration
  app.get('/api/pr2-clean/:id', async (req, res) => {
    try {
      const configId = parseInt(req.params.id);
      console.log(`🔍 GET request for configuration ID: ${configId}`);
      
      const [configuration] = await db
        .select()
        .from(pr2Configurations)
        .where(eq(pr2Configurations.id, configId));
      
      if (!configuration) {
        console.log(`❌ Configuration ${configId} not found`);
        return res.status(404).json({ error: 'Configuration not found' });
      }
      
      console.log(`✅ Loading clean PR2 configuration ${configId} for sector:`, configuration.sector);
      
      res.json(configuration);
    } catch (error) {
      console.error('Error fetching clean PR2 configuration:', error);
      res.status(500).json({ error: 'Failed to fetch configuration' });
    }
  });

  // POST create new clean PR2 configuration
  app.post('/api/pr2-clean', async (req, res) => {
    try {
      console.log('📝 Clean PR2 POST request body:', req.body);
      
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
        sector,
        sectors,
        categoryColor
      } = req.body;

      const [newConfig] = await db
        .insert(pr2Configurations)
        .values({
          userId: "test-user",
          categoryId: req.body.categoryId || "clean-" + Date.now(),
          categoryName: categoryName || 'New Clean Configuration',
          description: description || 'Clean PR2 configuration',
          sector: sector || 'utilities', // Single sector per configuration
          categoryColor: categoryColor || '#ffffff', // Default white color - user must assign color
          pricingOptions: pricingOptions || [],
          quantityOptions: quantityOptions || [],
          minQuantityOptions: minQuantityOptions || [],
          rangeOptions: rangeOptions || [],
          rangeValues: {},
          mathOperators: mathOperators || ['N/A'],
          isActive: true
        })
        .returning();

      console.log('✅ Created clean PR2 configuration:', newConfig);
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
      console.log('📝 Clean PR2 PUT request body:', req.body);
      
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
        sector,
        sectors,
        categoryColor
      } = req.body;

      const [updatedConfig] = await db
        .update(pr2Configurations)
        .set({
          categoryName: categoryName || 'Updated Clean Configuration',
          description: description || 'Clean PR2 configuration',
          sector: sector || 'utilities', // Single sector per configuration
          categoryColor: categoryColor, // Use the provided color
          pricingOptions: pricingOptions || [],
          quantityOptions: quantityOptions || [],
          minQuantityOptions: minQuantityOptions || [],
          rangeOptions: rangeOptions || [],
          rangeValues: {},
          mathOperators: mathOperators || ['N/A'],
          updatedAt: new Date()
        })
        .where(eq(pr2Configurations.id, configId))
        .returning();

      if (!updatedConfig) {
        return res.status(404).json({ error: 'Configuration not found' });
      }

      console.log('✅ Updated clean PR2 configuration:', updatedConfig);
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
      console.log('🚨 USER-APPROVED DELETION:', {
        configId: configId,
        categoryId: existingConfig[0].categoryId,
        categoryName: existingConfig[0].categoryName,
        timestamp: new Date().toISOString()
      });

      const [deletedConfig] = await db
        .delete(pr2Configurations)
        .where(eq(pr2Configurations.id, configId))
        .returning();

      console.log('✅ Deleted clean PR2 configuration:', deletedConfig.id);
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