import { useState, useRef, useCallback } from "react";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { Upload, X, FileText, Database } from "lucide-react";

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFile?: File | null;
  accept?: string;
  maxSize?: number;
  className?: string;
  requiresSector?: boolean;
  selectedSector?: string;
  onSectorPrompt?: () => void;
  onFileSelectedWithoutSector?: (file: File) => void;
}

export default function FileUpload({ 
  onFileSelect, 
  selectedFile, 
  accept = ".pdf,.db,.db3",
  maxSize = 50 * 1024 * 1024, // 50MB default
  className = "",
  requiresSector = false,
  selectedSector = "",
  onSectorPrompt,
  onFileSelectedWithoutSector
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file && validateFile(file)) {
      // Check if sector is required but not selected
      if (requiresSector && !selectedSector) {
        if (onFileSelectedWithoutSector) {
          onFileSelectedWithoutSector(file);
        }
        return;
      }
      
      onFileSelect(file);
    }
  }, [onFileSelect, maxSize, requiresSector, selectedSector, onFileSelectedWithoutSector]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      // Check if sector is required but not selected
      if (requiresSector && !selectedSector) {
        if (onFileSelectedWithoutSector) {
          onFileSelectedWithoutSector(file);
        }
        return;
      }
      
      onFileSelect(file);
    }
  }, [onFileSelect, maxSize, requiresSector, selectedSector, onFileSelectedWithoutSector]);

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxSize) {
      alert(`File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`);
      return false;
    }

    // Check file type
    const allowedExtensions = accept.split(',').map(ext => ext.trim());
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isValidType = allowedExtensions.some(ext => 
      ext === fileExtension || 
      (ext === '.pdf' && file.type === 'application/pdf') ||
      (ext === '.db' && (file.type === 'application/octet-stream' || file.name.endsWith('.db'))) ||
      (ext === '.db3' && (file.type === 'application/octet-stream' || file.name.endsWith('.db3') || file.name.endsWith('meta.db3')))
    );

    if (!isValidType) {
      alert('Please select a valid PDF or database file (.db, .db3, meta.db3)');
      return false;
    }

    return true;
  };

  const handleRemoveFile = () => {
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return extension === 'pdf' ? FileText : Database;
  };

  return (
    <div className={className}>
      {!selectedFile ? (
        <Card 
          className={`border-2 border-dashed transition-colors cursor-pointer upload-zone ${
            isDragOver 
              ? 'border-primary bg-primary/5 drag-over' 
              : 'border-slate-300 hover:border-primary hover:bg-primary/5'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="p-12 text-center">
            <div className="mb-4">
              <Upload className="h-12 w-12 text-slate-400 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Upload PDF or Database File
            </h3>
            <p className="text-slate-600 mb-4">
              Drag and drop your file here, or click to browse
            </p>
            <p className="text-sm text-slate-500 mb-4">
              Supports: PDF, .db, .db3, meta.db3 files (Max {Math.round(maxSize / (1024 * 1024))}MB)
            </p>
            <Button type="button" className="bg-primary hover:bg-primary/90">
              Choose File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={accept}
              onChange={handleFileInputChange}
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-emerald-200 bg-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {(() => {
                  const FileIcon = getFileIcon(selectedFile.name);
                  return <FileIcon className="h-8 w-8 text-emerald-600" />;
                })()}
                <div>
                  <p className="font-semibold text-slate-900">{selectedFile.name}</p>
                  <p className="text-sm text-slate-600">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
