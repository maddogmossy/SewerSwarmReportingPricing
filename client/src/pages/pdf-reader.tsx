import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Search, AlertCircle, CheckCircle, ArrowLeft, Upload, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

interface PDFExtractionResult {
  success: boolean;
  fileName: string;
  projectName?: string;
  date?: string;
  inspectionStandard?: string;
  totalPages: number;
  textLength?: number;
  sectionsExtracted?: number;
  sections: PDFSection[];
  missingSequences: number[];
  extractedText?: string;
  observations?: any[];
  errors: string[];
}

interface PDFSection {
  itemNo: number;
  inspectionNo: string;
  projectNo: string;
  date: string;
  time: string;
  startMH: string;
  startMHDepth: string;
  finishMH: string;
  finishMHDepth: string;
  pipeSize: string;
  pipeMaterial: string;
  totalLength: string;
  lengthSurveyed: string;
  defects: string;
  severityGrade: number;
  recommendations: string;
  adoptable: string;
  cost: string;
}

export default function PDFReaderPage() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractionResult, setExtractionResult] = useState<PDFExtractionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (
      file.type === 'application/pdf' || 
      file.name.endsWith('.db') || 
      file.name.endsWith('.db3') || 
      file.name.endsWith('meta.db3')
    )) {
      setSelectedFile(file);
      setExtractionResult(null);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a PDF or database file (.db, .db3, meta.db3)",
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
        description: `Extracted ${result.sections?.length || 0} sections from ${selectedFile.name}`,
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
              <p className="text-gray-600">Analyze PDF inspection reports and Wincan database files (.db3, meta.db3)</p>
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
              Select PDF or Database File for Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".pdf,.db,.db3"
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

        {/* File Statistics Cards */}
        {extractionResult && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">File Size</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{selectedFile ? (selectedFile.size / (1024 * 1024)).toFixed(1) + ' MB' : 'N/A'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Pages</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{extractionResult.totalPages}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Characters</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{extractionResult.textLength?.toLocaleString() || 'N/A'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Sections Found</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{extractionResult.sections?.length || 0}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Missing Sequences Warning */}
        {extractionResult && extractionResult.missingSequences?.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <AlertCircle className="h-5 w-5" />
                Missing Sections Detected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-orange-700">
                The following section numbers are missing from the sequence: {extractionResult.missingSequences.join(', ')}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Section Inspection Data Table - Matching Dashboard Format */}
        {extractionResult && extractionResult.sections && extractionResult.sections.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Section Inspection Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-purple-50">
                      <th className="border border-gray-300 px-1 py-2 text-center text-xs font-medium text-gray-700 uppercase w-12">Item No</th>
                      <th className="border border-gray-300 px-1 py-2 text-center text-xs font-medium text-gray-700 uppercase w-16">Inspec. No</th>
                      <th className="border border-gray-300 px-1 py-2 text-center text-xs font-medium text-gray-700 uppercase w-20">Project No</th>
                      <th className="border border-gray-300 px-1 py-2 text-center text-xs font-medium text-gray-700 uppercase w-16">Date</th>
                      <th className="border border-gray-300 px-1 py-2 text-center text-xs font-medium text-gray-700 uppercase w-16">Time</th>
                      <th className="border border-gray-300 px-1 py-2 text-center text-xs font-medium text-gray-700 uppercase w-20">Start MH</th>
                      <th className="border border-gray-300 px-1 py-2 text-center text-xs font-medium text-gray-700 uppercase w-20">Start MH Depth</th>
                      <th className="border border-gray-300 px-1 py-2 text-center text-xs font-medium text-gray-700 uppercase w-20">Finish MH</th>
                      <th className="border border-gray-300 px-1 py-2 text-center text-xs font-medium text-gray-700 uppercase w-20">Finish MH Depth</th>
                      <th className="border border-gray-300 px-1 py-2 text-center text-xs font-medium text-gray-700 uppercase w-20">Pipe Size</th>
                      <th className="border border-gray-300 px-1 py-2 text-center text-xs font-medium text-gray-700 uppercase w-24">Pipe Material</th>
                      <th className="border border-gray-300 px-1 py-2 text-center text-xs font-medium text-gray-700 uppercase w-20">Total Length</th>
                      <th className="border border-gray-300 px-1 py-2 text-center text-xs font-medium text-gray-700 uppercase w-20">Length Surveyed</th>
                      <th className="border border-gray-300 px-1 py-2 text-center text-xs font-medium text-gray-700 uppercase w-24">Observations</th>
                      <th className="border border-gray-300 px-1 py-2 text-center text-xs font-medium text-gray-700 uppercase w-16">Grade</th>
                      <th className="border border-gray-300 px-1 py-2 text-center text-xs font-medium text-gray-700 uppercase w-24">Recommendations</th>
                      <th className="border border-gray-300 px-1 py-2 text-center text-xs font-medium text-gray-700 uppercase w-20">Adoptable</th>
                      <th className="border border-gray-300 px-1 py-2 text-center text-xs font-medium text-gray-700 uppercase w-16">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extractionResult.sections.map((section) => (
                      <tr key={section.itemNo} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-1 py-2 text-center text-xs break-words">{section.itemNo}</td>
                        <td className="border border-gray-300 px-1 py-2 text-center text-xs break-words">{section.inspectionNo}</td>
                        <td className="border border-gray-300 px-1 py-2 text-center text-xs break-words">{section.projectNo}</td>
                        <td className="border border-gray-300 px-1 py-2 text-center text-xs break-words">{section.date}</td>
                        <td className="border border-gray-300 px-1 py-2 text-center text-xs break-words">{section.time}</td>
                        <td className="border border-gray-300 px-1 py-2 text-center text-xs break-words">{section.startMH}</td>
                        <td className="border border-gray-300 px-1 py-2 text-center text-xs break-words">{section.startMHDepth}</td>
                        <td className="border border-gray-300 px-1 py-2 text-center text-xs break-words">{section.finishMH}</td>
                        <td className="border border-gray-300 px-1 py-2 text-center text-xs break-words">{section.finishMHDepth}</td>
                        <td className="border border-gray-300 px-1 py-2 text-center text-xs break-words">{section.pipeSize}</td>
                        <td className="border border-gray-300 px-1 py-2 text-center text-xs break-words">{section.pipeMaterial}</td>
                        <td className="border border-gray-300 px-1 py-2 text-center text-xs break-words">{section.totalLength}</td>
                        <td className="border border-gray-300 px-1 py-2 text-center text-xs break-words">{section.lengthSurveyed}</td>
                        <td className="border border-gray-300 px-1 py-2 text-center text-xs break-words">{section.defects}</td>
                        <td className="border border-gray-300 px-1 py-2 text-center text-xs break-words">{section.severityGrade}</td>
                        <td className="border border-gray-300 px-1 py-2 text-center text-xs break-words">{section.recommendations}</td>
                        <td className="border border-gray-300 px-1 py-2 text-center text-xs break-words">{section.adoptable}</td>
                        <td className="border border-gray-300 px-1 py-2 text-center text-xs break-words">{section.cost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Raw PDF Text (First 2000 chars) */}
        {extractionResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Raw PDF Text (First 2000 chars)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="font-mono text-xs whitespace-pre-wrap bg-gray-50 p-4 rounded">
                  {extractionResult.extractedText}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* No Results Message */}
        {!extractionResult && !isAnalyzing && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No PDF Selected</h3>
              <p className="text-gray-500 text-center">
                Upload a PDF inspection report to analyze its contents and extract section data.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}