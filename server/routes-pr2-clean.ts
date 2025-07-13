import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { pr2Configurations, standardCategories } from "../shared/schema";
import { eq } from "drizzle-orm";

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

  // **CLEAN PR2 PRICING ENDPOINTS ONLY** - No legacy systems

  // PR2 Pricing Configuration endpoints
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

  app.post('/api/pr2-pricing', async (req, res) => {
    try {
      console.log('📝 PR2 POST request body:', req.body);
      
      const { 
        categoryId,
        categoryName, 
        description, 
        pricingOptions, 
        quantityOptions, 
        minQuantityOptions, 
        additionalOptions,
        rangeOptions, 
        rangeValues, 
        mathOperators, 
        stackOrder,
        sector 
      } = req.body;

      // Basic validation
      if (!categoryName) {
        return res.status(400).json({ error: 'Category name is required' });
      }

      const newConfig = {
        userId: "test-user",
        categoryId: categoryId || 'cleanse-survey',
        categoryName: categoryName || 'Cleanse and Survey',
        description: description || 'PR2 cleaning and survey configuration',
        pricingOptions: pricingOptions || {},
        quantityOptions: quantityOptions || {},
        minQuantityOptions: minQuantityOptions || {},
        additionalOptions: additionalOptions || {},
        rangeOptions: rangeOptions || [],
        rangeValues: rangeValues || {},
        mathOperators: mathOperators || [],
        stackOrder: stackOrder || {},
        sector: sector || 'utilities',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const [created] = await db
        .insert(pr2Configurations)
        .values(newConfig)
        .returning();

      console.log('✅ Created PR2 configuration:', created);
      res.json(created);
    } catch (error) {
      console.error('Error creating PR2 configuration:', error);
      res.status(500).json({ error: 'Failed to create configuration' });
    }
  });

  app.put('/api/pr2-pricing/:id', async (req, res) => {
    try {
      const configId = parseInt(req.params.id);
      console.log('📝 PR2 PUT request body:', req.body);
      
      const { 
        categoryName, 
        description, 
        pricingOptions, 
        quantityOptions, 
        minQuantityOptions, 
        additionalOptions,
        rangeOptions, 
        rangeValues, 
        mathOperators, 
        stackOrder,
        sector 
      } = req.body;

      const updateData = {
        categoryName: categoryName || 'Cleanse and Survey',
        description: description || 'PR2 cleaning and survey configuration',
        pricingOptions: pricingOptions || {},
        quantityOptions: quantityOptions || {},
        minQuantityOptions: minQuantityOptions || {},
        additionalOptions: additionalOptions || {},
        rangeOptions: rangeOptions || [],
        rangeValues: rangeValues || {},
        mathOperators: mathOperators || [],
        stackOrder: stackOrder || {},
        sector: sector || 'utilities',
        updatedAt: new Date()
      };
      
      const [updated] = await db
        .update(pr2Configurations)
        .set(updateData)
        .where(eq(pr2Configurations.id, configId))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: 'Configuration not found' });
      }

      console.log('✅ Updated PR2 configuration:', updated);
      res.json(updated);
    } catch (error) {
      console.error('Error updating PR2 configuration:', error);
      res.status(500).json({ error: 'Failed to update configuration' });
    }
  });

  app.delete('/api/pr2-pricing/:id', async (req, res) => {
    try {
      const configId = parseInt(req.params.id);
      
      const [deleted] = await db
        .delete(pr2Configurations)
        .where(eq(pr2Configurations.id, configId))
        .returning();

      if (!deleted) {
        return res.status(404).json({ error: 'Configuration not found' });
      }

      console.log(`✅ Deleted PR2 configuration ${configId}`);
      res.json({ success: true, deleted });
    } catch (error) {
      console.error('Error deleting PR2 configuration:', error);
      res.status(500).json({ error: 'Failed to delete configuration' });
    }
  });

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
      
      const [newCategory] = await db
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
      
      console.log('✅ Created standard category:', newCategory);
      res.json(newCategory);
    } catch (error) {
      console.error('Error creating standard category:', error);
      res.status(500).json({ error: 'Failed to create standard category' });
    }
  });

  app.delete('/api/standard-categories/:id', async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      
      // Check if there are any PR2 configurations using this category
      const dependentConfigs = await db
        .select()
        .from(pr2Configurations)
        .where(eq(pr2Configurations.categoryId, req.params.id));
      
      if (dependentConfigs.length > 0) {
        return res.status(400).json({ 
          error: `Cannot delete category. ${dependentConfigs.length} PR2 configurations are using this category. Please delete those configurations first.` 
        });
      }
      
      const [deleted] = await db
        .delete(standardCategories)
        .where(eq(standardCategories.id, categoryId))
        .returning();

      if (!deleted) {
        return res.status(404).json({ error: 'Category not found' });
      }

      console.log(`✅ Deleted standard category ${categoryId}`);
      res.json({ success: true, deleted });
    } catch (error) {
      console.error('Error deleting standard category:', error);
      res.status(500).json({ error: 'Failed to delete standard category' });
    }
  });

  const server = createServer(app);
  return server;
}