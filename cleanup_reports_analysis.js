// Analysis script to understand report visibility issues
console.log("🔍 REPORT VISIBILITY ANALYSIS\n");

import fs from "fs";
import path from "path";

const uploadsDir = path.join(process.cwd(), 'uploads');
const db3Files = fs.readdirSync(uploadsDir).filter(file => file.endsWith('.db3'));

console.log("📁 CURRENT REPORT STATUS:\n");

db3Files.forEach((filename) => {
  const filePath = path.join(uploadsDir, filename);
  const stats = fs.statSync(filePath);
  const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);
  
  console.log(`📄 ${filename}`);
  console.log(`   Size: ${sizeInMB} MB`);
  console.log(`   Status: ${sizeInMB === "0.00" ? "❌ EMPTY FILE" : "✅ Contains Data"}`);
  
  // Extract report details
  const reportMatch = filename.match(/([Gg][Rr]\d+[a-zA-Z]*)/);
  const reportNumber = reportMatch ? reportMatch[1].toUpperCase() : 'Unknown';
  
  if (reportNumber.includes('GR7188')) {
    if (filename.includes('7188A') || filename.includes('test_gr7188a')) {
      console.log(`   Type: GR7188A (variant report)`);
    } else {
      console.log(`   Type: GR7188 (main report)`);
    }
  } else if (reportNumber.includes('GR7216')) {
    console.log(`   Type: GR7216 (separate project)`);
  }
  
  console.log('');
});

console.log("🎯 ANALYSIS SUMMARY:");
console.log("• GR7188: Main files are 0 MB (empty), only backup/timestamped versions have data");
console.log("• GR7216: Main file is 0 MB (empty), no working version available");  
console.log("• GR7188A: Available as test_gr7188a.db3 with full data");
console.log("\n💡 RECOMMENDATION:");
console.log("• Remove empty 0 MB files to avoid confusion");
console.log("• Rename working files to proper report names");
console.log("• Consolidate duplicate files");