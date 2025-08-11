import { AlertTriangle, FileText, Upload } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface DataIntegrityWarningProps {
  message: string;
  details?: string[];
  showUploadButton?: boolean;
  onUploadClick?: () => void;
  type?: 'warning' | 'error' | 'info';
}

export function DataIntegrityWarning({ 
  message, 
  details, 
  showUploadButton = true, 
  onUploadClick,
  type = 'warning' 
}: DataIntegrityWarningProps) {
  
  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'info':
        return <FileText className="h-5 w-5 text-blue-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
    }
  };

  const getAlertClass = () => {
    switch (type) {
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-amber-200 bg-amber-50';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Alert className={`${getAlertClass()} border-2`}>
        <div className="flex items-start gap-3">
          {getIcon()}
          <div className="flex-1">
            <AlertTitle className="text-lg font-semibold mb-2">
              {type === 'error' ? 'Synthetic Data Blocked' : 
               type === 'info' ? 'No Data Available' : 
               'Data Integrity Warning'}
            </AlertTitle>
            <AlertDescription className="text-base mb-4">
              {message}
            </AlertDescription>
            
            {details && details.length > 0 && (
              <div className="bg-white/50 rounded-md p-3 mb-4">
                <p className="font-medium text-sm mb-2">Details:</p>
                <ul className="space-y-1">
                  {details.map((detail, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="space-y-3">
              <div className="bg-white/70 rounded-md p-3 border-l-4 border-blue-500">
                <p className="text-sm font-medium text-blue-800 mb-1">Data Integrity Policy</p>
                <p className="text-sm text-blue-700">
                  This system maintains 100% authentic data integrity. All data must come from 
                  genuine PDF inspection reports. Synthetic, mock, or placeholder data is prohibited.
                </p>
              </div>
              
              {showUploadButton && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={onUploadClick || (() => window.location.href = '/upload')}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Authentic PDF Report
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = '/standards-config'}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    View Standards Guide
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Alert>
    </div>
  );
}