import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface FileContentProps {
  projectNumber: string;
  files: Array<{
    fileName: string;
    fileType: 'Main Database' | 'Meta Database' | 'PDF Report';
    status: string;
    uploadDate: string;
  }>;
}

export function FileContentsDisplay({ projectNumber, files }: FileContentProps) {
  const mainFile = files.find(f => f.fileType === 'Main Database');
  const metaFile = files.find(f => f.fileType === 'Meta Database');
  const pdfFile = files.find(f => f.fileType === 'PDF Report');

  const hasCompleteDbPair = mainFile && metaFile;
  const hasMainOnly = mainFile && !metaFile;
  const hasPdfOnly = pdfFile && !mainFile && !metaFile;

  return (
    <div className="text-xs text-gray-600 mt-1 space-y-1">
      <div className="font-medium">Files in Report {projectNumber}:</div>
      
      {/* Main Database File */}
      {mainFile && (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="truncate max-w-48">{mainFile.fileName}</span>
          <Badge variant="secondary" className="text-xs">Main</Badge>
        </div>
      )}
      
      {/* Meta Database File */}
      {metaFile && (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="truncate max-w-48">{metaFile.fileName}</span>
          <Badge variant="secondary" className="text-xs">Meta</Badge>
        </div>
      )}
      
      {/* PDF File */}
      {pdfFile && (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          <span className="truncate max-w-48">{pdfFile.fileName}</span>
          <Badge variant="secondary" className="text-xs">PDF</Badge>
        </div>
      )}
      
      {/* Warning for incomplete pairs - only show if processing wasn't successful */}
      {hasMainOnly && (!mainFile?.extractedData || !JSON.parse(mainFile.extractedData)?.validationMessage?.includes('Both database files')) && (
        <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded">
          <AlertTriangle className="h-3 w-3" />
          <span className="text-xs">Missing Meta.db3 file - Grading may be incomplete</span>
        </div>
      )}
      
      {/* Status indicator */}
      <div className="text-xs text-gray-500 mt-1">
        {hasCompleteDbPair && "✅ Complete database pair"}
        {hasMainOnly && "⚠️ Incomplete database pair"}
        {hasPdfOnly && "📄 PDF report only"}
      </div>
    </div>
  );
}