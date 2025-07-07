// Test the regex pattern against known ECL text format
const testText = "Section Item 1:  F01-10A  >  F01-10  (F01-10AX)";
const testText2 = "Section Item 2:  F02-ST3  >  F02-03  (F02-ST3X)";

const pattern = /Section Item (\d+):\s+([A-Z0-9\-]+)\s+>\s+([A-Z0-9\-]+)\s+\(([A-Z0-9\-X]+)\)/g;

console.log("Testing regex patterns:");
console.log("Pattern:", pattern.source);
console.log();

console.log("Test 1:", testText);
const match1 = pattern.exec(testText);
console.log("Result 1:", match1);
pattern.lastIndex = 0; // Reset for next test

console.log();
console.log("Test 2:", testText2);
const match2 = pattern.exec(testText2);
console.log("Result 2:", match2);

// Test if ST is the issue
const pattern2 = /Section Item (\d+):\s+([A-Z0-9\-ST]+)\s+>\s+([A-Z0-9\-]+)\s+\(([A-Z0-9\-STX]+)\)/g;
pattern2.lastIndex = 0;
console.log();
console.log("Test with ST included:");
const match3 = pattern2.exec(testText2);
console.log("Result 3:", match3);