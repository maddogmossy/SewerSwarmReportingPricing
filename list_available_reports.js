// Script to list all available reports with full details
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

console.log("📋 AVAILABLE REPORTS INVENTORY\n");
console.log("═".repeat(60));

const uploadsDir = path.join(process.cwd(), 'uploads');
const db3Files = fs.readdirSync(uploadsDir).filter(file => file.endsWith('.db3'));

console.log(`Found ${db3Files.length} WinCan database files:\n`);

db3Files.forEach((filename, index) => {
  const dbPath = path.join(uploadsDir, filename);
  
  try {
    const db = new Database(dbPath, { readonly: true });
    
    // Extract report details
    const reportInfo = {
      id: index + 1,
      filename: filename,
      fileSize: (fs.statSync(dbPath).size / 1024 / 1024).toFixed(2) + ' MB'
    };
    
    // Try to get project details from different potential sources
    try {
      // Check for PROJECT table
      const projects = db.prepare("SELECT * FROM PROJECT LIMIT 1").all();
      if (projects.length > 0) {
        reportInfo.projectName = projects[0].PRJ_Name || projects[0].PRJ_Description || 'Unknown Project';
        reportInfo.projectCode = projects[0].PRJ_Code || projects[0].PRJ_Number || 'Unknown';
      }
    } catch {}
    
    // Get section count
    try {
      const sectionCount = db.prepare("SELECT COUNT(*) as count FROM SECTION WHERE OBJ_Key IS NOT NULL").get();
      reportInfo.sections = sectionCount.count;
    } catch {
      reportInfo.sections = 'Unknown';
    }
    
    // Get defect count  
    try {
      const defectCount = db.prepare("SELECT COUNT(*) as count FROM SECOBS WHERE OBS_OpCode NOT IN ('MH', 'MHF', 'IC', 'ICF', 'START', 'END')").get();
      reportInfo.defects = defectCount.count;
    } catch {
      reportInfo.defects = 'Unknown';
    }
    
    // Extract report number from filename
    const reportMatch = filename.match(/([Gg][Rr]\d+[a-zA-Z]*)/);
    reportInfo.reportNumber = reportMatch ? reportMatch[1].toUpperCase() : 'Unknown';
    
    // Extract location from filename
    const locationMatch = filename.match(/- (.*?) -/);
    reportInfo.location = locationMatch ? locationMatch[1] : filename.replace('.db3', '').replace(/^[^-]*-\s*/, '');
    
    console.log(`🗂️  Report ${reportInfo.id}:`);
    console.log(`   Filename: ${reportInfo.filename}`);
    console.log(`   Report Number: ${reportInfo.reportNumber}`);
    console.log(`   Location: ${reportInfo.location}`);
    console.log(`   File Size: ${reportInfo.fileSize}`);
    console.log(`   Sections: ${reportInfo.sections}`);
    console.log(`   Defects: ${reportInfo.defects}`);
    if (reportInfo.projectName) {
      console.log(`   Project: ${reportInfo.projectName}`);
    }
    console.log('');
    
    db.close();
    
  } catch (error) {
    console.log(`❌ Error reading ${filename}:`, error.message);
  }
});

console.log("═".repeat(60));
console.log(`Total authentic reports available: ${db3Files.length}`);