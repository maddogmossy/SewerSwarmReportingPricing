// Test the improved PDF extraction for Section 1
import { extractAuthenticDataFromPDF } from "./server/pdf-extractor.js";

async function testExtraction() {
  console.log("🧪 TESTING IMPROVED PDF EXTRACTION");
  
  // Use the 218ECL file (latest upload)
  const filePath = "uploads/da621e39feb964c85673ce0746662a76";
  
  try {
    const sections = await extractAuthenticDataFromPDF(filePath);
    
    if (sections.length > 0) {
      const section1 = sections[0];
      console.log("\n✅ SECTION 1 EXTRACTED DATA:");
      console.log("📅 Date:", section1.inspectionDate);
      console.log("⏰ Time:", section1.inspectionTime);
      console.log("🏁 Start MH:", section1.startMH);
      console.log("🏁 Finish MH:", section1.finishMH);
      console.log("🔧 Pipe Size:", section1.pipeSize);
      console.log("🧱 Material:", section1.pipeMaterial);
      console.log("📐 Length:", section1.totalLength);
      console.log("👁️ Observations:", section1.defects);
    } else {
      console.log("❌ No sections extracted");
    }
  } catch (error) {
    console.error("❌ Extraction failed:", error.message);
  }
}

testExtraction();