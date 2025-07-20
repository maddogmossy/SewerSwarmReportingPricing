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

export function validateGenericDb3Files(directory: string): { valid: boolean; message: string; files?: { main: string; meta: string } } {
  try {
    const files = fs.readdirSync(directory);
    const db3Files = files.filter(file => file.endsWith('.db3') && !file.includes('_Meta'));
    const metaFiles = files.filter(file => file.endsWith('_Meta.db3'));

    if (db3Files.length === 0 && metaFiles.length === 0) {
      return { valid: false, message: "❌ No .db3 files found. Please upload both inspection and metadata files." };
    }

    if (db3Files.length === 0) {
      return { valid: false, message: "⚠️ Missing main .db3 file. Please upload the inspection file." };
    }

    if (metaFiles.length === 0) {
      return { valid: false, message: "⚠️ Missing _Meta.db3 file. Please upload the metadata file." };
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

    return { valid: false, message: "⚠️ No matching .db3 and _Meta.db3 file pairs found. Please ensure files have matching names." };
  } catch (error) {
    return { valid: false, message: `❌ Error reading directory: ${error.message}` };
  }
}

export function checkMetaPairing(files: File[]) {
  const hasDb3 = files.some(file => file.name.endsWith('.db3') && !file.name.includes('Meta'));
  const hasMeta = files.some(file => file.name.toLowerCase().includes('meta.db3'));

  if (!hasDb3 || !hasMeta) {
    const missing = !hasDb3 ? "Main .db3" : "Meta.db3";
    window.dispatchEvent(
      new CustomEvent("SHOW_WARNING", {
        detail: `⚠️ Missing required file: ${missing}. Grading may be incomplete.`,
      })
    );
  }

  return { hasDb3, hasMeta };
}