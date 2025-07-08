import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Search, AlertCircle, CheckCircle, ArrowLeft, Upload, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

interface PDFExtractionResult {
  fileName: string;
  fileSize: number;
  totalPages: number;
  totalCharacters: number;
  headerData: {
    date?: string;
    time?: string;
    upstreamNode?: string;
    downstreamNode?: string;
    pipeSize?: string;
    pipeMaterial?: string;
    totalLength?: string;
    inspectedLength?: string;
    projectNumber?: string;
  };
  observations: string[];
  extractedText: string;
  errors: string[];
}

export default function PDFReaderPage() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractionResult, setExtractionResult] = useState<PDFExtractionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setExtractionResult(null);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a PDF file",
        variant: "destructive"
      });
    }
  };

  const analyzePDF = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('pdf', selectedFile);

      const response = await fetch('/api/analyze-pdf-standalone', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to analyze PDF');
      }

      const result = await response.json();
      setExtractionResult(result);
      
      toast({
        title: "PDF Analysis Complete",
        description: `Extracted header data from ${selectedFile.name}`,
      });
    } catch (error: any) {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">PDF Reader & Analysis Tool</h1>
              <p className="text-gray-600">Analyze PDF inspection reports and extract header information</p>
            </div>
          </div>
          <Link to="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* File Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Select PDF File for Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="flex-1"
              />
              <Button 
                onClick={analyzePDF} 
                disabled={!selectedFile || isAnalyzing}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Search className="h-4 w-4 mr-2" />
                {isAnalyzing ? 'Analyzing...' : 'Analyze PDF'}
              </Button>
            </div>
            {selectedFile && (
              <div className="text-sm text-gray-600">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analysis Results */}
        {extractionResult && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* File Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  File Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>File Name:</div>
                  <div className="font-mono">{extractionResult.fileName}</div>
                  <div>File Size:</div>
                  <div className="font-mono">{(extractionResult.fileSize / 1024 / 1024).toFixed(2)} MB</div>
                  <div>Total Pages:</div>
                  <div className="font-mono">{extractionResult.totalPages}</div>
                  <div>Characters:</div>
                  <div className="font-mono">{extractionResult.totalCharacters.toLocaleString()}</div>
                </div>
              </CardContent>
            </Card>

            {/* Extracted Header Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Extracted Header Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(extractionResult.headerData).map(([key, value]) => (
                    <div key={key} className="contents">
                      <div className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</div>
                      <div className="font-mono">{value || 'Not found'}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Observations */}
            {extractionResult.observations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Extracted Observations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {extractionResult.observations.map((obs, index) => (
                      <div key={index} className="bg-blue-50 p-2 rounded text-sm font-mono">
                        {obs}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Errors */}
            {extractionResult.errors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    Extraction Issues
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {extractionResult.errors.map((error, index) => (
                      <div key={index} className="bg-red-50 p-2 rounded text-sm text-red-700">
                        {error}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Raw PDF Text (First 2000 chars) */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  PDF Text Content (Preview)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <pre className="text-xs bg-gray-100 p-4 rounded whitespace-pre-wrap">
                    {extractionResult.extractedText.substring(0, 2000)}
                    {extractionResult.extractedText.length > 2000 && '\n... (truncated)'}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}

        {/* No Results Message */}
        {!extractionResult && !isAnalyzing && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No PDF Selected</h3>
              <p className="text-gray-500 text-center">
                Upload a PDF inspection report to analyze its contents and extract header information.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}