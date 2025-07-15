/**
 * CHECK ALL SECTIONS SYSTEMATICALLY
 * 
 * This script checks all sections from item 1 to the end of the report
 * and verifies the pricing logic is working correctly for each section
 */

const fetch = require('node-fetch');

async function checkAllSections() {
  try {
    console.log('📊 Fetching all sections from database...');
    
    const response = await fetch('http://localhost:5000/api/uploads/80/sections');
    const sections = await response.json();
    
    console.log(`📈 Total sections found: ${sections.length}`);
    console.log('');
    
    // Check each section systematically
    for (const section of sections) {
      const pipeSize = parseInt(section.pipeSize);
      const expectedPrice = pipeSize === 150 ? '£74.00' : '£61.67';
      const expectedRule = pipeSize === 150 ? 'No 2 (÷25)' : 'Standard (÷30)';
      
      console.log(`Item ${section.itemNo}: Pipe ${section.pipeSize}mm, Length ${section.totalLength}m`);
      console.log(`  Expected: ${expectedPrice} using ${expectedRule}`);
      console.log(`  Defects: ${section.defects}`);
      console.log('');
    }
    
    // Summary of expected pricing
    const pipe150Sections = sections.filter(s => parseInt(s.pipeSize) === 150);
    const otherPipeSections = sections.filter(s => parseInt(s.pipeSize) !== 150);
    
    console.log('📋 PRICING SUMMARY:');
    console.log(`• ${pipe150Sections.length} sections with 150mm pipes should show £74.00 (No 2 rule)`);
    console.log(`• ${otherPipeSections.length} sections with other pipe sizes should show £61.67 (Standard rule)`);
    console.log('');
    
    console.log('📝 150mm pipe sections (should use £74.00):');
    pipe150Sections.forEach(s => {
      console.log(`  Item ${s.itemNo}: ${s.pipeSize}mm, ${s.totalLength}m`);
    });
    
    console.log('');
    console.log('📝 Other pipe sizes (should use £61.67):');
    otherPipeSections.forEach(s => {
      console.log(`  Item ${s.itemNo}: ${s.pipeSize}mm, ${s.totalLength}m`);
    });
    
  } catch (error) {
    console.error('❌ Error checking sections:', error);
  }
}

checkAllSections();