/**
 * FIX ITEM 22 MULTI-DEFECT SPLITTING
 * Manually split Item 22 into service and structural sections
 */

import { db } from "./server/db.js";
import { sectionInspections } from "./shared/schema.js";
import { eq, and } from "drizzle-orm";

async function fixItem22Split() {
  try {
    console.log("🔧 Fixing Item 22 multi-defect splitting...");
    
    // Get current Item 22 data
    const currentItem22 = await db.query.sectionInspections.findFirst({
      where: and(
        eq(sectionInspections.fileUploadId, 83),
        eq(sectionInspections.itemNo, 22)
      )
    });
    
    if (!currentItem22) {
      console.log("❌ Item 22 not found");
      return;
    }
    
    console.log("📄 Current Item 22 defects:", currentItem22.defects);
    console.log("📄 Current defect type:", currentItem22.defectType);
    
    // Split the defects manually based on MSCC5 classification
    const serviceDefects = "DES Settled deposits, fine, 10% cross-sectional area loss at 21.75m. DES Settled deposits, fine, 20% cross-sectional area loss at 22.81m";
    const structuralDefects = "OJM 24.37m (Open joint, medium)";
    
    // Update Item 22 to be service-only
    await db.update(sectionInspections)
      .set({
        defects: serviceDefects,
        defectType: 'service',
        severityGrades: JSON.stringify({ "service": 4, "structural": 0 }),
        recommendations: "WRc Sewer Cleaning Manual: Standard cleaning and maintenance required"
      })
      .where(and(
        eq(sectionInspections.fileUploadId, 83),
        eq(sectionInspections.itemNo, 22)
      ));
    
    console.log("✅ Updated Item 22 with service defects only");
    
    // Create Item 22a for structural defects
    await db.insert(sectionInspections).values({
      fileUploadId: 83,
      itemNo: 22,
      letterSuffix: 'a',
      projectNo: currentItem22.projectNo,
      date: currentItem22.date,
      time: currentItem22.time,
      startMH: currentItem22.startMH,
      finishMH: currentItem22.finishMH,
      pipeSize: currentItem22.pipeSize,
      pipeMaterial: currentItem22.pipeMaterial,
      totalLength: currentItem22.totalLength,
      lengthSurveyed: currentItem22.lengthSurveyed,
      defects: structuralDefects,
      defectType: 'structural',
      recommendations: "WRc Drain Repair Book: Structural repair or relining required",
      severityGrades: JSON.stringify({ "service": 1, "structural": 2 }),
      severityGrade: 2,
      adoptable: currentItem22.adoptable,
      startMHDepth: currentItem22.startMHDepth,
      finishMHDepth: currentItem22.finishMHDepth
    });
    
    console.log("✅ Created Item 22a with structural defects");
    
    // Verify the split
    const verifyItems = await db.query.sectionInspections.findMany({
      where: and(
        eq(sectionInspections.fileUploadId, 83),
        eq(sectionInspections.itemNo, 22)
      ),
      orderBy: (t, { asc }) => asc(t.letterSuffix)
    });
    
    console.log("\n🔍 Verification results:");
    verifyItems.forEach(item => {
      const suffix = item.letterSuffix || '';
      console.log(`   Item 22${suffix}: ${item.defectType} - ${item.defects}`);
      console.log(`   STR/SER Grades: ${item.severityGrades}`);
    });
    
    console.log("\n✅ Item 22 multi-defect splitting complete!");
    console.log("🔄 Restart server to see changes on dashboard");
    
  } catch (error) {
    console.error("❌ Error fixing Item 22 split:", error);
  }
}

// Run the fix
fixItem22Split();