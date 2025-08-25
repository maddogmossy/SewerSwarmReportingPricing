// server/file-pairing-validator.ts
// Temporary shim (no DB). Keeps the same API so other imports won’t break.
// When we wire the DB, we’ll replace the internals to query actual uploads.

export interface UploadedFileLite {
  id: number;
  fileName: string;
  projectNumber: string | null;
  userId: string;
}

interface FilePair {
  mainFile?: {
    id: number;
    fileName: string;
    projectNumber: string;
  };
  metaFile?: {
    id: number;
    fileName: string;
    projectNumber: string;
  };
  pdfFile?: {
    id: number;
    fileName: string;
    projectNumber: string;
  };
}

export class FilePairingValidator {
  /**
   * TEMP: DB-less version.
   * Returns an "OK, but skipped" result so pages don’t crash before the DB is wired.
   * Once DB is ready, we will implement the real query here.
   */
  static async validateFilePairs(
    _userId: string
  ): Promise<{
    valid: boolean;
    warnings: string[];
    incompletePairs: FilePair[];
    completePairs: FilePair[];
  }> {
    // We intentionally don’t hit a DB here.
    // Signal that validation was skipped (non-fatal) so UI can proceed.
    return {
      valid: true,
      warnings: ["File pairing check skipped (DB not connected yet)."],
      incompletePairs: [],
      completePairs: [],
    };
  }

  /**
   * TEMP: DB-less validation for a single uploaded file.
   * We infer status purely from the filename. Without the DB, we can’t
   * know if a companion file exists, so we mark non-PDF as 'incomplete'.
   */
  static async validateUploadedFile(
    fileName: string,
    projectNumber: string | null,
    _userId: string
  ): Promise<{
    canProcess: boolean;
    warning?: string;
    pairStatus: "complete" | "incomplete" | "pdf_standalone";
  }> {
    const lower = fileName.toLowerCase();
    const isPdfFile = lower.endsWith(".pdf");
    const isMetaFile = lower.includes("meta") && lower.endsWith(".db3");
    const isMainDbFile = lower.endsWith(".db3") && !isMetaFile;

    if (!projectNumber) {
      return {
        canProcess: true,
        pairStatus: "incomplete",
        warning: "No project number detected. File processing will be limited.",
      };
    }

    if (isPdfFile) {
      // PDFs are standalone even without DB pairing
      return {
        canProcess: true,
        pairStatus: "pdf_standalone",
      };
    }

    if (isMainDbFile || isMetaFile) {
      // Without DB we can’t verify the counterpart’s existence.
      return {
        canProcess: true,
        pairStatus: "incomplete",
        warning:
          "Companion database file may be required (DB not connected to confirm).",
      };
    }

    return {
      canProcess: false,
      pairStatus: "incomplete",
      warning:
        "Unsupported file type. Upload .db3, Meta.db3, or .pdf files.",
    };
  }

  /**
   * OPTIONAL helper you can use in tests or local flows *without* DB:
   * Supply a list of files and get real pair validation purely in-memory.
   */
  static validatePairsFromList(
    files: UploadedFileLite[]
  ): {
    valid: boolean;
    warnings: string[];
    incompletePairs: FilePair[];
    completePairs: FilePair[];
  } {
    const filesByProject: Record<string, FilePair> = {};

    for (const f of files) {
      if (!f.projectNumber) continue;
      const pn = f.projectNumber;
      if (!filesByProject[pn]) filesByProject[pn] = {};

      const lower = f.fileName.toLowerCase();
      const isMetaFile = lower.includes("meta") && lower.endsWith(".db3");
      const isMainDbFile = lower.endsWith(".db3") && !isMetaFile;
      const isPdfFile = lower.endsWith(".pdf");

      if (isMainDbFile) {
        filesByProject[pn].mainFile = {
          id: f.id,
          fileName: f.fileName,
          projectNumber: pn,
        };
      } else if (isMetaFile) {
        filesByProject[pn].metaFile = {
          id: f.id,
          fileName: f.fileName,
          projectNumber: pn,
        };
      } else if (isPdfFile) {
        filesByProject[pn].pdfFile = {
          id: f.id,
          fileName: f.fileName,
          projectNumber: pn,
        };
      }
    }

    const warnings: string[] = [];
    const incompletePairs: FilePair[] = [];
    const completePairs: FilePair[] = [];

    Object.entries(filesByProject).forEach(([projectNumber, pair]) => {
      const hasMain = !!pair.mainFile;
      const hasMeta = !!pair.metaFile;
      const hasPdf = !!pair.pdfFile;

      if (hasMain && hasMeta) {
        completePairs.push(pair);
      } else if (hasMain && !hasMeta) {
        warnings.push(
          `Report ${projectNumber}: Missing Meta.db3 file. Service and structural grading may be incomplete.`
        );
        incompletePairs.push(pair);
      } else if (hasMeta && !hasMain) {
        warnings.push(
          `Report ${projectNumber}: Meta.db3 found without corresponding main database file.`
        );
        incompletePairs.push(pair);
      } else if (hasPdf && !hasMain && !hasMeta) {
        completePairs.push(pair); // PDF-only is acceptable
      }
    });

    return {
      valid: warnings.length === 0,
      warnings,
      incompletePairs,
      completePairs,
    };
  }
}