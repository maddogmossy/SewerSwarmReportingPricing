// Restore F606 to original authentic state and clean patching configurations
// Fix data contamination caused by shared MMP1Template state

import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import { pr2Configurations } from './shared/schema.ts';
import { eq } from 'drizzle-orm';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function restoreOriginalStates() {
  console.log('🔧 RESTORING F606 TO ORIGINAL STATE AND CLEANING PATCHING CONFIGS...');
  
  try {
    // Step 1: Restore F606 to its original authentic state
    console.log('🔄 Restoring F606 to original authentic state...');
    const originalF606MmData = {
      sector: "utilities",
      mm1Colors: "#10B981", // Original green color
      mm2IdData: [],
      mm3CustomPipeSizes: [],
      mm4DataByPipeSize: {
        "150-1501": [
          {
            id: 1,
            blueValue: "1850",
            greenValue: "22", 
            purpleDebris: "30",
            purpleLength: "33.99"
          },
          {
            id: 2,
            blueValue: "1850",
            greenValue: "20",
            purpleDebris: "40", 
            purpleLength: "66.99"
          }
        ]
      },
      mm5Data: [
        {
          id: 1,
          costPerMile: "",
          vehicleWeight: ""
        }
      ],
      selectedPipeSize: "150",
      selectedPipeSizeId: 1501,
      categoryId: "cctv-jet-vac",
      timestamp: Date.now()
    };

    await db.update(pr2Configurations)
      .set({
        categoryName: 'CCTV/Jet Vac Configuration',
        mmData: originalF606MmData,
        updatedAt: new Date()
      })
      .where(eq(pr2Configurations.id, 606));

    console.log('✅ F606 restored to original authentic state');

    // Step 2: Clean F608 - make sure it's blank
    console.log('🔄 Cleaning F608 to blank state...');
    const blankF608MmData = {
      sector: "utilities",
      mm1Colors: "#10B981",
      mm2IdData: [],
      mm3CustomPipeSizes: [],
      mm4DataByPipeSize: {
        "100-1001": [
          {
            id: 1,
            blueValue: "",
            greenValue: "",
            purpleDebris: "",
            purpleLength: ""
          }
        ]
      },
      mm5Data: [
        {
          id: 1,
          costPerMile: "",
          vehicleWeight: ""
        }
      ],
      selectedPipeSize: "100",
      selectedPipeSizeId: 1001,
      categoryId: "cctv-van-pack",
      timestamp: Date.now()
    };

    await db.update(pr2Configurations)
      .set({
        mmData: blankF608MmData,
        updatedAt: new Date()
      })
      .where(eq(pr2Configurations.id, 608));

    console.log('✅ F608 cleaned to blank state');

    // Step 3: Delete contaminated patching configurations and create fresh ones
    console.log('🔄 Removing contaminated patching configurations...');
    await db.delete(pr2Configurations).where(eq(pr2Configurations.id, 610));
    await db.delete(pr2Configurations).where(eq(pr2Configurations.id, 611));
    console.log('✅ Contaminated patching configs removed');

    // Step 4: Create fresh, clean patching configuration 
    console.log('🔄 Creating fresh f-patching-p006a configuration...');
    const cleanPatchingMmData = {
      sector: "utilities",
      mm1Colors: "#f97316", // Orange color for patching
      mm2IdData: [],
      mm3CustomPipeSizes: [],
      mm4DataByPipeSize: {
        "150-1501": [
          {
            id: 1,
            blueValue: "",
            greenValue: "",
            purpleDebris: "",
            purpleLength: "",
            singleLayer: "",
            doubleLayer: "",
            tripleLayer: "",
            tripleLayerExtraCure: ""
          }
        ]
      },
      mm5Data: [
        {
          id: 1,
          costPerMile: "",
          vehicleWeight: ""
        }
      ],
      selectedPipeSize: "150",
      selectedPipeSizeId: 1501,
      categoryId: "f-patching-p006a",
      timestamp: Date.now()
    };

    const [newPatching] = await db.insert(pr2Configurations).values({
      categoryId: 'f-patching-p006a',
      categoryName: 'F-Patching P006a Template',
      description: 'Independent patching configuration with Orange window containing 4 layer options',
      categoryColor: '#f97316',
      sector: 'utilities',
      pricingOptions: [],
      quantityOptions: [],
      minQuantityOptions: [],
      rangeOptions: [],
      mathOperators: ["N/A"],
      mmData: cleanPatchingMmData,
      userId: 'test-user'
    }).returning({ id: pr2Configurations.id });

    console.log('✅ Fresh f-patching-p006a configuration created with ID:', newPatching.id);

    // Step 5: Verify restoration
    console.log('🔍 Verifying restoration...');
    const restoredConfigs = await db.select({
      id: pr2Configurations.id,
      categoryId: pr2Configurations.categoryId,
      categoryName: pr2Configurations.categoryName,
      updatedAt: pr2Configurations.updatedAt
    }).from(pr2Configurations).where(
      eq(pr2Configurations.categoryId, 'cctv-jet-vac')
    );

    console.log('F606 Current State:', restoredConfigs);

    const patchingConfigs = await db.select({
      id: pr2Configurations.id,
      categoryId: pr2Configurations.categoryId,
      categoryName: pr2Configurations.categoryName
    }).from(pr2Configurations).where(
      eq(pr2Configurations.categoryId, 'f-patching-p006a')
    );

    console.log('Patching Configs:', patchingConfigs);

    console.log('🎉 RESTORATION COMPLETE!');
    console.log('✅ F606: Restored to original authentic state');
    console.log('✅ F608: Cleaned to blank state'); 
    console.log('✅ Patching: Fresh independent template created');
    console.log('✅ Data isolation: Configurations now properly separated');
    
  } catch (error) {
    console.error('❌ Error during restoration:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

restoreOriginalStates();