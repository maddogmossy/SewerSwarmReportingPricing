import { db } from './db';
import { fileUploads } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

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
   * Validates if uploaded files form complete pairs
   * Database files require both .db3 and Meta.db3
   * PDF files can stand alone but contain same data structure
   */
  static async validateFilePairs(userId: string): Promise<{
    valid: boolean;
    warnings: string[];
    incompletePairs: FilePair[];
    completePairs: FilePair[];
  }> {
    // Get all files for this user
    const userFiles = await db
      .select()
      .from(fileUploads)
      .where(eq(fileUploads.userId, userId));

    // Group files by project number
    const filesByProject: Record<string, FilePair> = {};
    
    userFiles.forEach(file => {
      if (!file.projectNumber) return;
      
      if (!filesByProject[file.projectNumber]) {
        filesByProject[file.projectNumber] = {};
      }
      
      const isMetaFile = file.fileName.toLowerCase().includes('meta') && file.fileName.endsWith('.db3');
      const isMainDbFile = file.fileName.endsWith('.db3') && !isMetaFile;
      const isPdfFile = file.fileName.endsWith('.pdf');
      
      if (isMainDbFile) {
        filesByProject[file.projectNumber].mainFile = {
          id: file.id,
          fileName: file.fileName,
          projectNumber: file.projectNumber
        };
      } else if (isMetaFile) {
        filesByProject[file.projectNumber].metaFile = {
          id: file.id,
          fileName: file.fileName,
          projectNumber: file.projectNumber
        };
      } else if (isPdfFile) {
        filesByProject[file.projectNumber].pdfFile = {
          id: file.id,
          fileName: file.fileName,
          projectNumber: file.projectNumber
        };
      }
    });

    const warnings: string[] = [];
    const incompletePairs: FilePair[] = [];
    const completePairs: FilePair[] = [];

    // Validate each project
    Object.entries(filesByProject).forEach(([projectNumber, filePair]) => {
      const hasMain = !!filePair.mainFile;
      const hasMeta = !!filePair.metaFile;
      const hasPdf = !!filePair.pdfFile;

      if (hasMain && hasMeta) {
        // Complete database pair
        completePairs.push(filePair);
      } else if (hasMain && !hasMeta) {
        // Incomplete database pair - main without meta
        warnings.push(`Report ${projectNumber}: Missing Meta.db3 file. Service and structural grading may be incomplete.`);
        incompletePairs.push(filePair);
      } else if (hasMeta && !hasMain) {
        // Meta without main (unusual)
        warnings.push(`Report ${projectNumber}: Meta.db3 found without corresponding main database file.`);
        incompletePairs.push(filePair);
      } else if (hasPdf && !hasMain && !hasMeta) {
        // PDF only - acceptable for future PDF processing
        completePairs.push(filePair);
      }
    });

    return {
      valid: warnings.length === 0,
      warnings,
      incompletePairs,
      completePairs
    };
  }

  /**
   * Validates file upload before processing
   * Checks if the uploaded file completes a pair or creates an incomplete pair
   */
  static async validateUploadedFile(
    fileName: string, 
    projectNumber: string, 
    userId: string
  ): Promise<{
    canProcess: boolean;
    warning?: string;
    pairStatus: 'complete' | 'incomplete' | 'pdf_standalone';
  }> {
    const isMetaFile = fileName.toLowerCase().includes('meta') && fileName.endsWith('.db3');
    const isMainDbFile = fileName.endsWith('.db3') && !isMetaFile;
    const isPdfFile = fileName.endsWith('.pdf');

    if (!projectNumber) {
      return {
        canProcess: true,
        pairStatus: 'incomplete',
        warning: 'No project number detected. File processing will be limited.'
      };
    }

    // Check if companion file exists
    const existingFiles = await db
      .select()
      .from(fileUploads)
      .where(
        and(
          eq(fileUploads.projectNumber, projectNumber),
          eq(fileUploads.userId, userId)
        )
      );

    if (isPdfFile) {
      // PDF files are standalone and processable
      return {
        canProcess: true,
        pairStatus: 'pdf_standalone'
      };
    }

    if (isMainDbFile) {
      const hasMetaFile = existingFiles.some(f => 
        f.fileName.toLowerCase().includes('meta') && f.fileName.endsWith('.db3')
      );
      
      return {
        canProcess: true,
        pairStatus: hasMetaFile ? 'complete' : 'incomplete',
        warning: hasMetaFile ? undefined : 'Consider uploading the corresponding Meta.db3 file for complete analysis.'
      };
    }

    if (isMetaFile) {
      const hasMainFile = existingFiles.some(f => 
        f.fileName.endsWith('.db3') && !f.fileName.toLowerCase().includes('meta')
      );
      
      return {
        canProcess: true,
        pairStatus: hasMainFile ? 'complete' : 'incomplete',
        warning: hasMainFile ? undefined : 'Meta.db3 file uploaded. Main database file is needed for processing.'
      };
    }

    return {
      canProcess: false,
      pairStatus: 'incomplete',
      warning: 'Unsupported file type. Upload .db3, Meta.db3, or .pdf files.'
    };
  }
}