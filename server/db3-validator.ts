import fs from 'fs';
import path from 'path';

export function validateDb3Files(directory: string): { valid: boolean; message: string } {
  const mainFile = fs.existsSync(path.join(directory, 'GR7188 - 40 Hollow Road - Bury St Edmunds - IP32 7AY.db3'));
  const metaFile = fs.existsSync(path.join(directory, 'GR7188 - 40 Hollow Road - Bury St Edmunds - IP32 7AY_Meta.db3'));

  if (!mainFile && !metaFile) {
    return { valid: false, message: "❌ No .db3 files found. Please upload both inspection and metadata files." };
  }
  if (!mainFile) {
    return { valid: false, message: "⚠️ Missing main .db3 file. Please upload the inspection file." };
  }
  if (!metaFile) {
    return { valid: false, message: "⚠️ Missing _Meta.db3 file. Please upload the metadata file." };
  }

  return { valid: true, message: "✅ Both database files loaded successfully." };
}

export function validateGenericDb3Files(directory: string, baseName?: string): { valid: boolean; message: string; files?: { main: string; meta?: string }; warning?: string } {
  try {
    const files = fs.readdirSync(directory);
    const db3Files = files.filter(file => file.endsWith('.db3') && !file.includes('_Meta'));
    const metaFiles = files.filter(file => file.endsWith('_Meta.db3'));

    if (db3Files.length === 0 && metaFiles.length === 0) {
      return { valid: false, message: "❌ No .db3 files found. Please upload inspection database files." };
    }

    if (db3Files.length === 0) {
      return { valid: false, message: "⚠️ Missing main .db3 file. Please upload the inspection file." };
    }

    // Try to find matching pairs
    for (const mainFile of db3Files) {
      const baseName = mainFile.replace('.db3', '');
      const expectedMetaFile = `${baseName}_Meta.db3`;
      
      if (metaFiles.includes(expectedMetaFile)) {
        return { 
          valid: true, 
          message: "✅ Both database files loaded successfully.",
          files: {
            main: path.join(directory, mainFile),
            meta: path.join(directory, expectedMetaFile)
          }
        };
      }
    }

    // If no meta file found, allow processing with warning
    if (metaFiles.length === 0) {
      console.warn("⚠️ Meta.db3 missing — grading will be partial.");
      
      return { 
        valid: true, 
        message: "✅ Main database file loaded successfully.",
        warning: "⚠️ Meta.db3 missing — grading will be partial.",
        files: {
          main: path.join(directory, db3Files[0])
        }
      };
    }

    return { valid: false, message: "⚠️ No matching .db3 and _Meta.db3 file pairs found. Please ensure files have matching names." };
  } catch (error) {
    return { valid: false, message: `❌ Error reading directory: ${error.message}` };
  }
}

export function validateSpecificDb3File(filePath: string, originalFileName: string): { valid: boolean; message: string; files?: { main: string; meta?: string }; warning?: string } {
  try {
    // Check if the uploaded file exists
    if (!fs.existsSync(filePath)) {
      return { valid: false, message: "❌ Uploaded file not found." };
    }

    // For a single file upload, we only validate the main file and allow processing
    // The Meta.db3 file should be uploaded separately or together
    const directory = path.dirname(filePath);
    const baseName = originalFileName.replace('.db3', '');
    const expectedMetaFile = `${baseName}_Meta.db3`;
    const metaFilePath = path.join(directory, expectedMetaFile);

    if (fs.existsSync(metaFilePath)) {
      return {
        valid: true,
        message: "✅ Both database files loaded successfully.",
        files: {
          main: filePath,
          meta: metaFilePath
        }
      };
    } else {
      return {
        valid: true,
        message: "✅ Main database file loaded successfully.",
        warning: "⚠️ Meta.db3 missing — grading will be partial.",
        files: {
          main: filePath
        }
      };
    }
  } catch (error) {
    return { valid: false, message: `❌ Error validating file: ${error.message}` };
  }
}