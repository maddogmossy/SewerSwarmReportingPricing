/**
 * COMPLETE WORKFLOW TEST - ALL 4 FIXES
 * 
 * Tests the complete PDF extraction workflow with all fixes:
 * 1. Project number extraction from filename (218ECL → 2025)
 * 2. Date/time extraction from PDF header 
 * 3. Sequential item numbering (1, 2, 3...)
 * 4. Authentic observation data extraction
 */

import { db } from './server/db.ts';
import { fileUploads, sectionInspections } from './shared/schema.ts';
import { eq } from 'drizzle-orm';

async function testCompleteWorkflow() {
  console.log('🎯 TESTING COMPLETE PDF WORKFLOW WITH ALL 4 FIXES');
  console.log('================================================');
  
  try {
    // Step 1: Create test upload with ECL filename pattern
    console.log('📄 Step 1: Creating test upload with ECL filename...');
    const [upload] = await db.insert(fileUploads).values({
      userId: 'test-user',
      fileName: '218ECL-NEWARK.pdf', // Should extract "2025" from this
      fileSize: 1024000,
      fileType: 'pdf',
      filePath: '/uploads/test-218ecl.pdf',
      uploadStatus: 'completed',
      processingStatus: 'completed',
      sector: 'utilities'
    }).returning();
    
    console.log(`✅ Created upload ID ${upload.id} with filename: ${upload.fileName}`);
    
    // Step 2: Test the extraction process by calling the API
    console.log('🔍 Step 2: Testing PDF extraction via API...');
    
    const testResponse = await fetch('http://localhost:5000/api/debug-pdf-workflow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uploadId: upload.id,
        testMode: true
      })
    });
    
    if (!testResponse.ok) {
      throw new Error(`API request failed: ${testResponse.status}`);
    }
    
    const extractionResult = await testResponse.json();
    console.log('📊 Extraction Result:', JSON.stringify(extractionResult, null, 2));
    
    // Step 3: Check database for extracted sections
    console.log('🔍 Step 3: Checking database for extracted sections...');
    
    const sections = await db.select()
      .from(sectionInspections)
      .where(eq(sectionInspections.fileUploadId, upload.id))
      .orderBy(sectionInspections.itemNo);
    
    console.log(`📋 Found ${sections.length} sections in database`);
    
    // Step 4: Validate all 4 fixes
    console.log('✅ Step 4: Validating all 4 fixes...');
    
    let allFixesWorking = true;
    const validationResults = {
      projectNumber: false,
      dateTime: false,
      sequentialNumbering: false,
      observationData: false
    };
    
    if (sections.length > 0) {
      const firstSection = sections[0];
      
      // Fix 1: Project number from filename (218ECL → 2025)
      if (firstSection.projectNo === "2025") {
        validationResults.projectNumber = true;
        console.log('✅ Fix 1: Project number correctly extracted from filename');
      } else {
        console.log(`❌ Fix 1: Project number incorrect. Expected "2025", got "${firstSection.projectNo}"`);
        allFixesWorking = false;
      }
      
      // Fix 2: Date/time from header
      if (firstSection.inspectionDate !== "no data recorded" && firstSection.inspectionTime !== "no data recorded") {
        validationResults.dateTime = true;
        console.log(`✅ Fix 2: Date/time extracted from header: ${firstSection.inspectionDate} ${firstSection.inspectionTime}`);
      } else {
        console.log(`❌ Fix 2: Date/time not extracted. Date: "${firstSection.inspectionDate}", Time: "${firstSection.inspectionTime}"`);
        allFixesWorking = false;
      }
      
      // Fix 3: Sequential numbering (1, 2, 3...)
      let sequentialCorrect = true;
      for (let i = 0; i < Math.min(5, sections.length); i++) {
        if (sections[i].itemNo !== i + 1) {
          sequentialCorrect = false;
          break;
        }
      }
      
      if (sequentialCorrect) {
        validationResults.sequentialNumbering = true;
        console.log('✅ Fix 3: Sequential numbering working correctly');
      } else {
        console.log('❌ Fix 3: Sequential numbering incorrect');
        allFixesWorking = false;
      }
      
      // Fix 4: Observation data extraction
      const hasAuthenticObservations = sections.some(section => 
        section.defects && 
        section.defects !== "no data recorded" && 
        section.defects !== "No action required pipe observed in acceptable structural and service condition" &&
        (section.defects.includes("WL") || section.defects.includes("DEG") || section.defects.includes("LL"))
      );
      
      if (hasAuthenticObservations) {
        validationResults.observationData = true;
        console.log('✅ Fix 4: Authentic observation data extracted');
      } else {
        console.log('❌ Fix 4: No authentic observation data found');
        allFixesWorking = false;
      }
    } else {
      console.log('❌ No sections extracted - cannot validate fixes');
      allFixesWorking = false;
    }
    
    // Step 5: Summary
    console.log('\n📊 WORKFLOW TEST SUMMARY');
    console.log('========================');
    console.log(`Upload ID: ${upload.id}`);
    console.log(`Filename: ${upload.fileName}`);
    console.log(`Sections extracted: ${sections.length}`);
    console.log('Fix status:');
    console.log(`  1. Project number extraction: ${validationResults.projectNumber ? '✅' : '❌'}`);
    console.log(`  2. Date/time extraction: ${validationResults.dateTime ? '✅' : '❌'}`);
    console.log(`  3. Sequential numbering: ${validationResults.sequentialNumbering ? '✅' : '❌'}`);
    console.log(`  4. Observation data: ${validationResults.observationData ? '✅' : '❌'}`);
    
    if (allFixesWorking) {
      console.log('\n🎉 ALL 4 FIXES WORKING CORRECTLY - PDF EXTRACTION WORKFLOW COMPLETE');
    } else {
      console.log('\n⚠️ Some fixes need attention - see details above');
    }
    
    // Show sample of extracted data
    if (sections.length > 0) {
      console.log('\n📋 SAMPLE EXTRACTED DATA:');
      console.log('Section 1:', {
        itemNo: sections[0].itemNo,
        projectNo: sections[0].projectNo,
        date: sections[0].inspectionDate,
        time: sections[0].inspectionTime,
        startMH: sections[0].startMH,
        finishMH: sections[0].finishMH,
        pipeSize: sections[0].pipeSize,
        pipeMaterial: sections[0].pipeMaterial,
        defects: sections[0].defects?.substring(0, 100) + '...'
      });
    }
    
    return {
      success: true,
      uploadId: upload.id,
      sectionsExtracted: sections.length,
      allFixesWorking,
      validationResults
    };
    
  } catch (error) {
    console.error('❌ Workflow test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
testCompleteWorkflow()
  .then(result => {
    console.log('\n🏁 Test completed:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test error:', error);
    process.exit(1);
  });