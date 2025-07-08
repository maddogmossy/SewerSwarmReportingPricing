import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Eye, Database, AlertTriangle, CheckCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface PDFAnalysis {
  fileName: string;
  fileSize: number;
  totalPages: number;
  totalCharacters: number;
  extractedSections: any[];
  rawPDFText: string;
  sectionPatterns: string[];
  manholeReferences: string[];
  pipeSpecifications: string[];
  defectCodes: string[];
  inspectionDates: string[];
  errors: string[];
  warnings: string[];
}

export default function PDFReaderPage() {
  const [selectedUploadId, setSelectedUploadId] = useState<number | null>(null);
  const [analysisType, setAnalysisType] = useState<'overview' | 'sections' | 'raw' | 'patterns'>('overview');

  // Get list of uploaded files
  const { data: uploads } = useQuery({
    queryKey: ['/api/uploads'],
    select: (data) => data.filter((upload: any) => upload.status === 'completed')
  });

  // Get PDF analysis for selected file
  const { data: pdfAnalysis, isLoading, error } = useQuery({
    queryKey: ['/api/pdf-analysis', selectedUploadId],
    queryFn: () => selectedUploadId ? apiRequest('POST', '/api/analyze-pdf', { uploadId: selectedUploadId }) : null,
    enabled: !!selectedUploadId
  });

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
          <FileText className="h-8 w-8 text-blue-600" />
          PDF Reader & Analysis
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Analyze PDF content before database insertion to identify extraction errors
        </p>
      </div>

      {/* File Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select PDF File to Analyze</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploads?.map((upload: any) => (
              <Button
                key={upload.id}
                variant={selectedUploadId === upload.id ? 'default' : 'outline'}
                className="h-auto p-4 flex flex-col items-start gap-2"
                onClick={() => setSelectedUploadId(upload.id)}
              >
                <div className="font-medium text-left">{upload.fileName}</div>
                <div className="text-xs text-gray-500">
                  Upload ID: {upload.id} | Status: {upload.status}
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* PDF Analysis Results */}
      {selectedUploadId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              PDF Analysis Results
              {pdfAnalysis && (
                <Badge variant={pdfAnalysis.errors?.length > 0 ? 'destructive' : 'default'}>
                  {pdfAnalysis.errors?.length || 0} Errors
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Analyzing PDF...</span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="text-red-800">Error analyzing PDF: {error.message}</span>
              </div>
            )}

            {pdfAnalysis && (
              <Tabs value={analysisType} onValueChange={(value: any) => setAnalysisType(value)}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="sections">Sections</TabsTrigger>
                  <TabsTrigger value="patterns">Patterns</TabsTrigger>
                  <TabsTrigger value="raw">Raw Text</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-blue-600">{pdfAnalysis.totalPages}</div>
                        <div className="text-sm text-gray-600">Total Pages</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-green-600">
                          {pdfAnalysis.totalCharacters?.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">Characters</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-purple-600">
                          {pdfAnalysis.extractedSections?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Sections Found</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-orange-600">
                          {pdfAnalysis.errors?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Errors</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Errors and Warnings */}
                  {pdfAnalysis.errors?.length > 0 && (
                    <Card className="mb-4 border-red-200">
                      <CardHeader>
                        <CardTitle className="text-red-700 flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          Critical Errors Found
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {pdfAnalysis.errors.map((error: string, index: number) => (
                            <li key={index} className="text-red-700 flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              {error}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {pdfAnalysis.warnings?.length > 0 && (
                    <Card className="mb-4 border-yellow-200">
                      <CardHeader>
                        <CardTitle className="text-yellow-700">Warnings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1">
                          {pdfAnalysis.warnings.map((warning: string, index: number) => (
                            <li key={index} className="text-yellow-700">• {warning}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="sections" className="mt-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Database className="h-5 w-5" />
                      <h3 className="text-lg font-semibold">
                        Extracted Sections ({pdfAnalysis.extractedSections?.length || 0})
                      </h3>
                    </div>
                    
                    <ScrollArea className="h-96 border rounded-lg p-4">
                      {pdfAnalysis.extractedSections?.map((section: any, index: number) => (
                        <Card key={index} className="mb-4">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                              Section {section.itemNo}
                              {section.errors?.length > 0 ? (
                                <Badge variant="destructive">
                                  {section.errors.length} Error(s)
                                </Badge>
                              ) : (
                                <Badge variant="default">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Valid
                                </Badge>
                              )}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <strong>Manholes:</strong> {section.startMH} → {section.finishMH}
                              </div>
                              <div>
                                <strong>Pipe:</strong> {section.pipeSize} {section.pipeMaterial}
                              </div>
                              <div>
                                <strong>Length:</strong> {section.totalLength}
                              </div>
                              <div>
                                <strong>Grade:</strong> {section.severityGrade}
                              </div>
                              <div className="col-span-2">
                                <strong>Defects:</strong> {section.defects || 'None'}
                              </div>
                              <div className="col-span-2">
                                <strong>Recommendations:</strong> {section.recommendations || 'None'}
                              </div>
                            </div>
                            {section.errors && (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                                <strong className="text-red-700">Errors:</strong>
                                <ul className="text-red-600 text-xs mt-1">
                                  {section.errors.map((error: string, i: number) => (
                                    <li key={i}>• {error}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </ScrollArea>
                  </div>
                </TabsContent>

                <TabsContent value="patterns" className="mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Manhole References</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-48">
                          <div className="space-y-1 text-sm font-mono">
                            {pdfAnalysis.manholeReferences?.map((ref: string, index: number) => (
                              <div key={index} className="p-1 bg-gray-50 rounded">{ref}</div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Pipe Specifications</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-48">
                          <div className="space-y-1 text-sm font-mono">
                            {pdfAnalysis.pipeSpecifications?.map((spec: string, index: number) => (
                              <div key={index} className="p-1 bg-gray-50 rounded">{spec}</div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Defect Codes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-48">
                          <div className="space-y-1 text-sm font-mono">
                            {pdfAnalysis.defectCodes?.map((code: string, index: number) => (
                              <div key={index} className="p-1 bg-gray-50 rounded">{code}</div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Section Patterns</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-48">
                          <div className="space-y-1 text-sm font-mono">
                            {pdfAnalysis.sectionPatterns?.map((pattern: string, index: number) => (
                              <div key={index} className="p-1 bg-gray-50 rounded">{pattern}</div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="raw" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Raw PDF Text Content</CardTitle>
                      <p className="text-sm text-gray-600">
                        First 5000 characters of extracted PDF text
                      </p>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-96">
                        <pre className="text-xs font-mono whitespace-pre-wrap bg-gray-50 p-4 rounded">
                          {pdfAnalysis.rawPDFText?.substring(0, 5000)}
                          {pdfAnalysis.rawPDFText?.length > 5000 && '...[truncated]'}
                        </pre>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}