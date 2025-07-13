import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { pr2Configurations, standardCategories } from "../shared/schema";
import { eq } from "drizzle-orm";

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

  // Other legacy endpoints
  app.get('/api/pr2-pricing', async (req, res) => {
    try {
      const configurations = await db
        .select()
        .from(pr2Configurations)
        .where(eq(pr2Configurations.userId, "test-user"));
      
      console.log(`✅ Loading ${configurations.length} PR2 configurations from database`);
      res.json(configurations);
    } catch (error) {
      console.error('Error fetching PR2 configurations:', error);
      res.status(500).json({ error: 'Failed to fetch configurations' });
    }
  });

  app.get('/api/pr2-pricing/:id', async (req, res) => {
    try {
      const configId = parseInt(req.params.id);
      const [configuration] = await db
        .select()
        .from(pr2Configurations)
        .where(eq(pr2Configurations.id, configId));
      
      if (!configuration) {
        return res.status(404).json({ error: 'Configuration not found' });
      }
      
      console.log(`✅ Loading PR2 configuration ${configId}`);
      res.json(configuration);
    } catch (error) {
      console.error('Error fetching PR2 configuration:', error);
      res.status(500).json({ error: 'Failed to fetch configuration' });
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
      const configurations = await db
        .select()
        .from(pr2Configurations)
        .where(eq(pr2Configurations.userId, "test-user"));
      
      console.log(`✅ Loading ${configurations.length} clean PR2 configurations`);
      res.json(configurations);
    } catch (error) {
      console.error('Error fetching clean PR2 configurations:', error);
      res.status(500).json({ error: 'Failed to fetch configurations' });
    }
  });

  // GET single clean PR2 configuration
  app.get('/api/pr2-clean/:id', async (req, res) => {
    try {
      const configId = parseInt(req.params.id);
      const [configuration] = await db
        .select()
        .from(pr2Configurations)
        .where(eq(pr2Configurations.id, configId));
      
      if (!configuration) {
        return res.status(404).json({ error: 'Configuration not found' });
      }
      
      console.log(`✅ Loading clean PR2 configuration ${configId}`);
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
        additionalOptions,
        mathOperators,
        pricingStackOrder,
        sector
      } = req.body;

      const [newConfig] = await db
        .insert(pr2Configurations)
        .values({
          userId: "test-user",
          categoryId: req.body.categoryId || "clean-" + Date.now(),
          categoryName: categoryName || 'New Clean Configuration',
          description: description || 'Clean PR2 configuration',
          pricingOptions: pricingOptions || [],
          quantityOptions: quantityOptions || {},
          minQuantityOptions: minQuantityOptions || {},
          rangeOptions: [],
          rangeValues: {},
          mathOperators: mathOperators || ['N/A'],
          sector: sector || 'utilities',
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
        additionalOptions,
        mathOperators,
        pricingStackOrder,
        sector
      } = req.body;

      const [updatedConfig] = await db
        .update(pr2Configurations)
        .set({
          categoryName: categoryName || 'Updated Clean Configuration',
          description: description || 'Clean PR2 configuration',
          pricingOptions: pricingOptions || [],
          quantityOptions: quantityOptions || {},
          minQuantityOptions: minQuantityOptions || {},
          rangeOptions: [],
          rangeValues: {},
          mathOperators: mathOperators || ['N/A'],
          sector: sector || 'utilities',
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