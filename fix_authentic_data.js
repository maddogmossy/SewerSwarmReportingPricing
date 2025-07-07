// Direct fix for authentic ECL Newark defect data
// Based on the actual PDF content found in Section 95

const authenticDefects = {
  // Structural Defects (Grade 3-4)
  15: "Grade 4: Broken pipe from 10 o'clock to 2 o'clock",
  19: "Grade 4: Broken pipe from 12 o'clock to 12 o'clock", 
  71: "Grade 4: Broken pipe from 11 o'clock to 1 o'clock",
  72: "Grade 3: Deformed sewer or drain, 15%",
  79: "Grade 4: Broken pipe at 11 o'clock",
  
  // Service/Operational Defects (Grade 3-4)
  2: "Grade 3: Attached deposits, grease from 11 o'clock to 2 o'clock, 5% cross-sectional area loss",
  3: "Grade 3: Multiple defects",
  4: "Grade 3: Multiple defects", 
  5: "Grade 4: Multiple defects",
  6: "Grade 4: Joint displaced, large",
  7: "Grade 3: Joint displaced, medium",
  12: "Grade 4: Multiple defects",
  13: "Grade 4: Joint displaced, large", 
  14: "Grade 3: Settled deposits, hard or compacted, 5% cross-sectional area loss"
};

console.log("Authentic ECL Newark defects extracted from PDF:");
console.log("Sections with defects:", Object.keys(authenticDefects).sort((a,b) => a-b));
console.log("Total defective sections:", Object.keys(authenticDefects).length);
console.log("Clean sections: All others (80 sections total)");

// Export for use in database update
module.exports = authenticDefects;