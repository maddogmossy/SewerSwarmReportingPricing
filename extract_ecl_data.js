import fs from 'fs';
import pdf from 'pdf-parse';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function extractECLData() {
  try {
    // Read the PDF file
    const pdfPath = path.join(__dirname, 'uploads/2809f7f24e094c88ce6211bae824e21a');
    const dataBuffer = fs.readFileSync(pdfPath);
    
    // Parse PDF
    const data = await pdf(dataBuffer);
    
    console.log('PDF Text Content:');
    console.log('================');
    console.log(data.text);
    
    // Save to file for analysis
    fs.writeFileSync('./ecl_extracted_text.txt', data.text);
    console.log('\nText saved to ecl_extracted_text.txt');
    
  } catch (error) {
    console.error('Error extracting PDF:', error);
  }
}

extractECLData();