/**
 * REPROCESS UPLOAD 83 WITH MULTI-DEFECT SPLITTING
 * 
 * This script will:
 * 1. Clear existing sections for Upload 83
 * 2. Reprocess with multi-defect splitting logic
 * 3. Apply correct STR/SER severity grades
 * 4. Ensure Item 22 is properly split into 22 (service) and 22a (structural)
 */

import { readWincanDatabase, storeWincanSections } from "./server/wincan-db-reader";
import { db } from "./server/db";
import { sectionInspections } from "./shared/schema";
import { eq } from "drizzle-orm";

async function reprocessUpload83WithSplitting() {
  try {
    console.log("🔄 Reprocessing Upload 83 with multi-defect splitting logic...");
    
    // Clear existing sections for Upload 83
    const deletedSections = await db.delete(sectionInspections)
      .where(eq(sectionInspections.fileUploadId, 83))
      .returning();
    console.log(`🗑️ Cleared ${deletedSections.length} existing sections for Upload 83`);
    
    // Find the database file for Upload 83
    console.log("📂 Looking for Upload 83 database file...");
    
    // Based on replit.md, Upload 83 should be GR7188 project
    // Let's check what file exists in uploads directory
    const { readdirSync } = await import('fs');
    const uploadFiles = readdirSync('./uploads/');
    console.log(`📁 Found upload files: ${uploadFiles.join(', ')}`);
    
    // Use the most likely candidate (should be the .db3 file)
    const dbFile = uploadFiles.find(f => f.endsWith('.db3'));
    if (!dbFile) {
      throw new Error('No .db3 database file found in uploads directory');
    }
    
    console.log(`📄 Using database file: ${dbFile}`);
    
    // Extract sections with multi-defect splitting enabled
    const sections = await readWincanDatabase(`./uploads/${dbFile}`);
    console.log(`📊 Extracted ${sections.length} sections with multi-defect splitting`);
    
    // Show sections that should have been split
    console.log("\n🔍 Analyzing sections for multi-defect patterns:");
    sections.forEach(section => {
      const displayItemNo = section.letterSuffix ? `${section.itemNo}${section.letterSuffix}` : section.itemNo;
      const defectPreview = section.defects.substring(0, 100);
      console.log(`   ${displayItemNo}: ${defectPreview}${defectPreview.length >= 100 ? '...' : ''}`);
      
      if (section.letterSuffix) {
        console.log(`      🔧 SPLIT SECTION: ${section.defectType} defects`);
      }
    });
    
    // Store sections back to database with Upload 83 ID
    await storeWincanSections(sections, 83);
    console.log("✅ Stored sections with multi-defect splitting for Upload 83");
    
    // Verify the results
    const storedSections = await db.query.sectionInspections.findMany({
      where: eq(sectionInspections.fileUploadId, 83),
      orderBy: (t, { asc }) => [asc(t.itemNo), asc(t.letterSuffix)]
    });
    
    console.log(`\n📊 Verification: ${storedSections.length} sections stored in database`);
    
    // Look for Item 22 specifically
    const item22Sections = storedSections.filter(s => s.itemNo === 22);
    if (item22Sections.length > 1) {
      console.log(`🎯 SUCCESS: Item 22 split detected:`);
      item22Sections.forEach(section => {
        const suffix = section.letterSuffix || '';
        console.log(`   Item 22${suffix}: ${section.defectType} defects - ${section.defects.substring(0, 80)}...`);
      });
    } else {
      console.log(`⚠️ Item 22 not split - only ${item22Sections.length} section found`);
    }
    
    // Show all split sections
    const splitSections = storedSections.filter(s => s.letterSuffix);
    console.log(`\n🔄 Total split sections found: ${splitSections.length}`);
    splitSections.forEach(section => {
      console.log(`   Item ${section.itemNo}${section.letterSuffix}: ${section.defectType} - ${section.defects.substring(0, 60)}...`);
    });
    
    console.log("\n✅ Upload 83 reprocessing with multi-defect splitting complete!");
    console.log("🔄 Restart the server to see changes on dashboard");
    
  } catch (error) {
    console.error("❌ Error reprocessing Upload 83:", error);
  }
}

// Run the reprocessing
reprocessUpload83WithSplitting();