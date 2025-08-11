import React, { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface UploadPairValidatorProps {
  onFilesSelected: (files: FileList) => void;
  className?: string;
}

export function UploadPairValidator({ onFilesSelected, className }: UploadPairValidatorProps) {
  const [validationStatus, setValidationStatus] = useState<{
    hasMain: boolean;
    hasMeta: boolean;
    projectNumber?: string;
    warning?: string;
  }>({ hasMain: false, hasMeta: false });

  const validateFiles = (files: FileList) => {
    const fileArray = Array.from(files);
    const hasMain = fileArray.some(f => f.name.endsWith('.db3') && !f.name.toLowerCase().includes('meta'));
    const hasMeta = fileArray.some(f => f.name.toLowerCase().includes('meta') && f.name.endsWith('.db3'));
    
    // Extract project number from main file
    const mainFile = fileArray.find(f => f.name.endsWith('.db3') && !f.name.toLowerCase().includes('meta'));
    const projectNumber = mainFile?.name.match(/GR(\d+[a-zA-Z]?)/)?.[1];

    let warning: string | undefined;
    if (hasMain && !hasMeta) {
      warning = 'Missing Meta.db3 file. Upload both files together for complete analysis.';
    } else if (hasMeta && !hasMain) {
      warning = 'Missing main database file. Upload both .db3 and Meta.db3 files together.';
    } else if (!hasMain && !hasMeta) {
      warning = 'Select both database files: Main (.db3) and Meta (Meta.db3)';
    }

    setValidationStatus({ hasMain, hasMeta, projectNumber, warning });
    
    if (hasMain && hasMeta) {
      onFilesSelected(files);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      validateFiles(files);
    }
  };

  return (
    <div className={className}>
      <input
        type="file"
        multiple
        accept=".db3,.db,.pdf"
        onChange={handleFileChange}
        className="mb-3"
      />
      
      {validationStatus.warning && (
        <Alert className="mb-3" variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{validationStatus.warning}</AlertDescription>
        </Alert>
      )}
      
      {validationStatus.hasMain && validationStatus.hasMeta && (
        <Alert className="mb-3" variant="default">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Complete file pair ready for upload: Project {validationStatus.projectNumber}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="text-xs text-gray-600 space-y-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${validationStatus.hasMain ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          <span>Main Database (.db3)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${validationStatus.hasMeta ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          <span>Meta Database (Meta.db3)</span>
        </div>
      </div>
    </div>
  );
}