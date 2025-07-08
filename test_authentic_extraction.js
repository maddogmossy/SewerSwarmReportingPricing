/**
 * TEST AUTHENTIC EXTRACTION - ALL 4 FIXES WITH REAL PDF DATA
 * 
 * Tests using authentic PDF data from attached files
 */

import { db } from './server/db.ts';
import { fileUploads, sectionInspections } from './shared/schema.ts';
import { eq } from 'drizzle-orm';
import fs from 'fs';

async function testAuthenticExtraction() {
  console.log('🎯 TESTING AUTHENTIC PDF EXTRACTION - ALL 4 FIXES');
  console.log('===============================================');
  
  try {
    // Step 1: Create upload with authentic ECL filename
    console.log('📄 Step 1: Creating authentic ECL upload...');
    const [upload] = await db.insert(fileUploads).values({
      userId: 'test-user',
      fileName: '218ECL-BOWBRIDGE-LANE-NEWARK.pdf',
      fileSize: 5000000,
      fileType: 'pdf',
      filePath: '/uploads/authentic-ecl.pdf',
      uploadStatus: 'completed',
      processingStatus: 'pending',
      sector: 'utilities'
    }).returning();
    
    console.log(`✅ Created upload ID ${upload.id} with authentic filename`);
    
    // Step 2: Create authentic PDF content from attached files
    const authenticPDFContent = `
Project
Project Name:
E.C.L.BOWBRIDGE  LANE_NEWARK
Project Description:
CCTV
Project Date:
10/02/2025
Inspection Standard:
MSCC5 Sewers & Drainage GB (SRM5 Scoring)

Table of Contents
Section Item 1:  F01-10A  >  F01-10  (F01-10AX)
Section Item 2:  F02-ST3  >  F02-03  (F02-ST3X)
Section Item 3:  F01-10  >  F02-03  (F01-10X)
Section Item 4:  F02-03  >  F02-04  (F02-03X)
Section Item 5:  F02-04  >  F02-05  (F02-04X)
Section Item 6:  F02-05  >  F02-06  (F02-05X)
Section Item 7:  F02-06  >  F02-7  (F02-06X)
Section Item 9:  S01-12  >  S02-02  (S01-12X)
Section Item 10:  S02-02  >  S02-03  (S02-02X)
Section Item 11:  S02-03  >  S02-04  (S02-03X)

Section Inspection Item 1
Item No: 1
Date: 14/02/25
Time: 11:22
Upstream Node: F01-10A
Downstream Node: F01-10
Pipe Size: 150mm
Pipe Material: Vitrified clay
Total Length: 14.27m
Length Surveyed: 14.27m
Observations: WL 0.00m (Water level, 5% of the vertical dimension)

Section Inspection Item 2
Item No: 2
Date: 14/02/25
Time: 11:30
Upstream Node: F02-ST3
Downstream Node: F02-03
Pipe Size: 300mm
Pipe Material: Vitrified clay
Total Length: 11.04m
Length Surveyed: 11.04m
Observations: DEG at 7.08 and a CL, CLJ at 11.04
`;
    
    // Step 3: Test the extraction function directly
    console.log('🔍 Step 3: Testing extraction function with authentic data...');
    
    // Import the extraction function
    const { extractAdoptionSectionsFromPDF } = await import('./server/routes.ts');
    
    // Call extraction function with authentic PDF content
    const extractedSections = await extractAdoptionSectionsFromPDF(authenticPDFContent, upload.id);
    
    console.log(`📊 Extracted ${extractedSections.length} sections from authentic PDF data`);
    
    // Step 4: Insert sections into database
    if (extractedSections.length > 0) {
      console.log('💾 Step 4: Inserting extracted sections into database...');
      await db.insert(sectionInspections).values(extractedSections);
      console.log(`✅ Inserted ${extractedSections.length} sections`);
    }
    
    // Step 5: Validate all 4 fixes
    console.log('🔍 Step 5: Validating all 4 fixes with authentic data...');
    
    const sections = await db.select()
      .from(sectionInspections)
      .where(eq(sectionInspections.fileUploadId, upload.id))
      .orderBy(sectionInspections.itemNo);
    
    console.log(`📋 Retrieved ${sections.length} sections from database`);
    
    let allFixesWorking = true;
    const fixes = {
      projectNumber: false,
      dateExtraction: false,
      sequentialNumbering: false,
      observationData: false
    };
    
    if (sections.length >= 2) {
      const section1 = sections[0];
      const section2 = sections[1];
      
      // Fix 1: Project number extraction
      if (section1.projectNo === "ECL NEWARK") {
        fixes.projectNumber = true;
        console.log('✅ Fix 1: Project number correctly extracted - "ECL NEWARK"');
      } else {
        console.log(`❌ Fix 1: Project number incorrect. Expected "ECL NEWARK", got "${section1.projectNo}"`);
        allFixesWorking = false;
      }
      
      // Fix 2: Date extraction from header
      if (section1.date === "10/02/2025") {
        fixes.dateExtraction = true;
        console.log('✅ Fix 2: Date correctly extracted from header - "10/02/2025"');
      } else {
        console.log(`❌ Fix 2: Date incorrect. Expected "10/02/2025", got "${section1.date}"`);
        allFixesWorking = false;
      }
      
      // Fix 3: Sequential numbering
      if (section1.itemNo === 1 && section2.itemNo === 2) {
        fixes.sequentialNumbering = true;
        console.log('✅ Fix 3: Sequential numbering working - 1, 2, 3...');
      } else {
        console.log(`❌ Fix 3: Sequential numbering incorrect. Got ${section1.itemNo}, ${section2.itemNo}`);
        allFixesWorking = false;
      }
      
      // Fix 4: Authentic observation data
      const hasAuthenticObservations = 
        section1.defects.includes("WL 0.00m") && 
        section2.defects.includes("DEG at 7.08");
      
      if (hasAuthenticObservations) {
        fixes.observationData = true;
        console.log('✅ Fix 4: Authentic observation data extracted');
      } else {
        console.log('❌ Fix 4: Authentic observation data missing');
        allFixesWorking = false;
      }
    } else {
      console.log('❌ Insufficient sections extracted for validation');
      allFixesWorking = false;
    }
    
    // Step 6: Display results
    console.log('\n📊 AUTHENTIC EXTRACTION TEST RESULTS');
    console.log('====================================');
    console.log(`Upload ID: ${upload.id}`);
    console.log(`Filename: ${upload.fileName}`);
    console.log(`Sections extracted: ${sections.length}`);
    console.log('');
    console.log('Fix Status:');
    console.log(`1. Project number from filename: ${fixes.projectNumber ? '✅' : '❌'}`);
    console.log(`2. Date from PDF header: ${fixes.dateExtraction ? '✅' : '❌'}`);
    console.log(`3. Sequential numbering: ${fixes.sequentialNumbering ? '✅' : '❌'}`);
    console.log(`4. Authentic observation data: ${fixes.observationData ? '✅' : '❌'}`);
    
    if (allFixesWorking) {
      console.log('\n🎉 ALL 4 FIXES WORKING WITH AUTHENTIC DATA');
    } else {
      console.log('\n⚠️ Some fixes need attention');
    }
    
    // Display sample data
    if (sections.length > 0) {
      console.log('\n📋 AUTHENTIC EXTRACTED DATA SAMPLE:');
      sections.slice(0, 2).forEach(section => {
        console.log(`Section ${section.itemNo}:`);
        console.log(`  Project: ${section.projectNo}`);
        console.log(`  Date: ${section.date}`);
        console.log(`  Manholes: ${section.startMH} → ${section.finishMH}`);
        console.log(`  Pipe: ${section.pipeSize} ${section.pipeMaterial}`);
        console.log(`  Length: ${section.totalLength}`);
        console.log(`  Observations: ${section.defects}`);
        console.log('');
      });
    }
    
    return {
      success: true,
      uploadId: upload.id,
      sectionsExtracted: sections.length,
      allFixesWorking,
      fixes
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
testAuthenticExtraction()
  .then(result => {
    console.log('\n🏁 Authentic extraction test completed');
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test error:', error);
    process.exit(1);
  });