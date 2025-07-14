import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { pr2Configurations, standardCategories } from "../shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";

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
        // Filter by userId, sector, and categoryId
        console.log(`🔍 Filtering by userId: "test-user", sector: "${sector}", AND categoryId: "${categoryId}"`);
        configurations = await db
          .select()
          .from(pr2Configurations)
          .where(and(
            eq(pr2Configurations.userId, "test-user"),
            eq(pr2Configurations.categoryId, categoryId),
            sql`${pr2Configurations.sectors} && ARRAY[${sql.raw(`'${sector}'`)}]::text[]`
          ));
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
        // Filter by both userId and sector using array contains operator
        console.log(`🔍 Filtering by userId: "test-user" AND sector: "${sector}"`);
        configurations = await db
          .select()
          .from(pr2Configurations)
          .where(and(
            eq(pr2Configurations.userId, "test-user"),
            sql`${pr2Configurations.sectors} && ARRAY[${sql.raw(`'${sector}'`)}]::text[]`
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
        console.log(`📊 Configuration details:`, configurations.map(c => `ID: ${c.id}, Sectors: ${JSON.stringify(c.sectors)}`));
      }
      
      // Map sectors array to legacy sector field for frontend compatibility
      const mappedConfigurations = configurations.map(config => ({
        ...config,
        sector: config.sectors && config.sectors.length > 0 ? config.sectors[0] : 'utilities' // Use first sector as legacy field
      }));
      
      res.json(mappedConfigurations);
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
      
      console.log(`✅ Loading clean PR2 configuration ${configId} with sectors:`, configuration.sectors);
      
      // Map sectors array to legacy sector field for frontend compatibility
      const mappedConfiguration = {
        ...configuration,
        sector: configuration.sectors && configuration.sectors.length > 0 ? configuration.sectors[0] : 'utilities'
      };
      
      res.json(mappedConfiguration);
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
        sectors
      } = req.body;

      const [newConfig] = await db
        .insert(pr2Configurations)
        .values({
          userId: "test-user",
          categoryId: req.body.categoryId || "clean-" + Date.now(),
          categoryName: categoryName || 'New Clean Configuration',
          description: description || 'Clean PR2 configuration',
          pricingOptions: pricingOptions || [],
          quantityOptions: quantityOptions || [],
          minQuantityOptions: minQuantityOptions || [],
          rangeOptions: rangeOptions || [],
          rangeValues: {},
          mathOperators: mathOperators || ['N/A'],
          sectors: sectors || [sector || 'utilities'],
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
        sectors
      } = req.body;

      const [updatedConfig] = await db
        .update(pr2Configurations)
        .set({
          categoryName: categoryName || 'Updated Clean Configuration',
          description: description || 'Clean PR2 configuration',
          pricingOptions: pricingOptions || [],
          quantityOptions: quantityOptions || [],
          minQuantityOptions: minQuantityOptions || [],
          rangeOptions: rangeOptions || [],
          rangeValues: {},
          mathOperators: mathOperators || ['N/A'],
          sectors: sectors || [sector || 'utilities'],
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

  // DELETE clean PR2 configuration
  app.delete('/api/pr2-clean/:id', async (req, res) => {
    try {
      const configId = parseInt(req.params.id);
      
      const [deletedConfig] = await db
        .delete(pr2Configurations)
        .where(eq(pr2Configurations.id, configId))
        .returning();

      if (!deletedConfig) {
        return res.status(404).json({ error: 'Configuration not found' });
      }

      console.log('✅ Deleted clean PR2 configuration:', deletedConfig.id);
      res.json({ message: 'Configuration deleted successfully' });
    } catch (error) {
      console.error('Error deleting clean PR2 configuration:', error);
      res.status(500).json({ error: 'Failed to delete configuration' });
    }
  });
}