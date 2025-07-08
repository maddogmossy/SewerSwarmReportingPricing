/**
 * COMPREHENSIVE PDF PROCESSING TEST
 * 
 * This script runs a full front-to-back test of PDF processing to ensure:
 * 1. Only authentic data is extracted from the PDF
 * 2. No synthetic/fake data is generated
 * 3. Data integrity validation is enforced
 * 4. Sequential item numbering (1, 2, 3...) is applied
 * 5. Observation data is correctly extracted from PDF table structure
 */

import fetch from 'node-fetch';
import fs from 'fs';
import FormData from 'form-data';

const API_BASE = 'http://localhost:5000';

async function runComprehensivePDFTest() {
  console.log('🔍 COMPREHENSIVE PDF PROCESSING TEST');
  console.log('=====================================');
  
  try {
    // Step 1: Upload PDF file using standalone analyzer
    console.log('📄 Step 1: Testing PDF upload and processing...');
    
    const pdfPath = './attached_assets/Pasted-Project-Project-Name-E-C-L-BOWBRIDGE-LANE-NEWARK-Project-Description-CCTV-Project-Date-10--1751984507686_1751984507687.txt';
    
    if (!fs.existsSync(pdfPath)) {
      console.error('❌ PDF file not found at:', pdfPath);
      return;
    }
    
    const formData = new FormData();
    formData.append('pdf', fs.createReadStream(pdfPath));
    
    const response = await fetch(`${API_BASE}/api/analyze-pdf-standalone`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('✅ PDF processing completed successfully');
    console.log(`📊 Total sections extracted: ${result.sections.length}`);
    
    // Step 2: Validate data integrity
    console.log('\n🔒 Step 2: Validating data integrity...');
    
    const validationResults = {
      sequentialNumbering: true,
      noSyntheticData: true,
      authenticObservations: true,
      noFakeDepths: true,
      issues: []
    };
    
    result.sections.forEach((section, index) => {
      const expectedItemNo = index + 1;
      
      // Check sequential numbering
      if (section.itemNo !== expectedItemNo) {
        validationResults.sequentialNumbering = false;
        validationResults.issues.push(`Section ${index + 1}: Expected itemNo ${expectedItemNo}, got ${section.itemNo}`);
      }
      
      // Check for synthetic data patterns
      const syntheticPatterns = [
        /1\.5m|1\.8m/, // Fake MH depths
        /test|mock|placeholder|example/i,
        /SW\d{2}→SW\d{2}/, // Generic SW patterns (unless authentic)
        /\b1\.0m\b|\b2\.5m\b/, // Common test patterns
      ];
      
      syntheticPatterns.forEach(pattern => {
        if (pattern.test(JSON.stringify(section))) {
          validationResults.noSyntheticData = false;
          validationResults.issues.push(`Section ${section.itemNo}: Synthetic data pattern detected`);
        }
      });
      
      // Check MH depths are not fake
      if (section.startMHDepth !== 'no data recorded' && 
          (section.startMHDepth === '1.5m' || section.startMHDepth === '1.8m')) {
        validationResults.noFakeDepths = false;
        validationResults.issues.push(`Section ${section.itemNo}: Fake MH depth detected: ${section.startMHDepth}`);
      }
      
      // Check for authentic observations
      if (section.defects === 'No action required pipe observed in acceptable structural and service condition') {
        // This is only valid if the section truly has no defects
        console.log(`ℹ️  Section ${section.itemNo}: No defects recorded (may be authentic)`);
      } else {
        // Check if defects contain authentic observation codes
        const hasObservationCodes = /WL|LL|REM|MCPP|REST BEND|JN|BRF|DER|FC|CR|DEG/.test(section.defects);
        if (!hasObservationCodes && section.defects !== 'no data recorded') {
          validationResults.authenticObservations = false;
          validationResults.issues.push(`Section ${section.itemNo}: Defects don't contain authentic observation codes`);
        }
      }
    });
    
    // Step 3: Report results
    console.log('\n📋 Step 3: Test Results Summary');
    console.log('================================');
    
    console.log(`✅ Sequential numbering: ${validationResults.sequentialNumbering ? 'PASS' : 'FAIL'}`);
    console.log(`✅ No synthetic data: ${validationResults.noSyntheticData ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Authentic observations: ${validationResults.authenticObservations ? 'PASS' : 'FAIL'}`);
    console.log(`✅ No fake depths: ${validationResults.noFakeDepths ? 'PASS' : 'FAIL'}`);
    
    if (validationResults.issues.length > 0) {
      console.log('\n❌ Issues found:');
      validationResults.issues.forEach(issue => console.log(`  - ${issue}`));
    } else {
      console.log('\n🎉 All tests passed! Data integrity maintained.');
    }
    
    // Step 4: Sample data examination
    console.log('\n🔍 Step 4: Sample Data Examination');
    console.log('===================================');
    
    const sampleSections = result.sections.slice(0, 3);
    sampleSections.forEach(section => {
      console.log(`\nSection ${section.itemNo}:`);
      console.log(`  Start MH: ${section.startMH}`);
      console.log(`  Finish MH: ${section.finishMH}`);
      console.log(`  Pipe Size: ${section.pipeSize}`);
      console.log(`  Pipe Material: ${section.pipeMaterial}`);
      console.log(`  Defects: ${section.defects.substring(0, 100)}${section.defects.length > 100 ? '...' : ''}`);
      console.log(`  MH Depths: ${section.startMHDepth} / ${section.finishMHDepth}`);
    });
    
    // Step 5: Overall assessment
    console.log('\n🏆 Final Assessment');
    console.log('===================');
    
    const allTestsPassed = validationResults.sequentialNumbering && 
                          validationResults.noSyntheticData && 
                          validationResults.authenticObservations && 
                          validationResults.noFakeDepths;
    
    if (allTestsPassed) {
      console.log('✅ COMPREHENSIVE TEST PASSED');
      console.log('The PDF processing system is working correctly with authentic data only.');
    } else {
      console.log('❌ COMPREHENSIVE TEST FAILED');
      console.log('Data integrity issues detected. Review the issues above.');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
runComprehensivePDFTest();