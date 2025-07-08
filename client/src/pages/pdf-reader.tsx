import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Eye, Database, AlertTriangle, CheckCircle, Play, ArrowLeft } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

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
  const { toast } = useToast();
  const [selectedUploadId, setSelectedUploadId] = useState<number | null>(null);
  
  // Get uploadId from URL params if available (for paused uploads)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const uploadId = urlParams.get('uploadId');
    if (uploadId) {
      setSelectedUploadId(parseInt(uploadId));
    }
  }, []);

  // Get list of uploaded files (including paused ones)
  const { data: uploads } = useQuery({
    queryKey: ['/api/uploads'],
    select: (data) => data.filter((upload: any) => 
      upload.status === 'completed' || upload.status === 'extracted_pending_review'
    )
  });
  
  // Get specific upload details
  const { data: currentUpload } = useQuery({
    queryKey: [`/api/uploads/${selectedUploadId}`],
    enabled: !!selectedUploadId,
  });

  // Get PDF analysis for selected file
  const { data: pdfAnalysis, isLoading, error } = useQuery({
    queryKey: ['/api/pdf-analysis', selectedUploadId],
    queryFn: () => selectedUploadId ? apiRequest('POST', '/api/analyze-pdf', { uploadId: selectedUploadId }) : null,
    enabled: !!selectedUploadId
  });

  // Get actual database sections to display dashboard format (same as dashboard)
  const { data: sectionData } = useQuery({
    queryKey: [`/api/uploads/${selectedUploadId}/sections`],
    enabled: !!selectedUploadId,
  });

  // Continue processing mutation for paused uploads
  const continueProcessingMutation = useMutation({
    mutationFn: (uploadId: number) => apiRequest('POST', `/api/continue-processing/${uploadId}`, {}),
    onSuccess: (data) => {
      toast({
        title: "Processing Continued",
        description: `Successfully processed ${data.sectionsProcessed} sections. Redirecting to dashboard...`,
      });
      // Redirect to dashboard after successful processing
      setTimeout(() => {
        window.location.href = `/dashboard?reportId=${selectedUploadId}`;
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: "Continue Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Process the data the same way dashboard does
  const expandedSectionData = sectionData ? sectionData.flatMap((section: any) => {
    const sections = [];
    sections.push({
      ...section,
      itemNoDisplay: section.itemNo,
    });
    return sections;
  }) : [];

  // Debug logging
  console.log('PDF Reader Debug:', {
    selectedUploadId,
    sectionDataLength: sectionData?.length,
    expandedDataLength: expandedSectionData?.length,
    firstSection: expandedSectionData?.[0]
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
          <div className="grid gap-3">
            {uploads?.map((upload: any) => (
              <Button
                key={upload.id}
                variant={selectedUploadId === upload.id ? "default" : "outline"}
                className="w-full text-left p-4 h-auto"
                onClick={() => setSelectedUploadId(upload.id)}
              >
                <div className="flex flex-col items-start w-full">
                  <div className="font-medium">{upload.fileName}</div>
                  <div className="text-sm text-gray-500">
                    Upload ID: {upload.id} | Status: {upload.status}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Paused Upload Actions */}
      {selectedUploadId && currentUpload?.status === 'extracted_pending_review' && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Workflow Paused - Review Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-orange-700">
                PDF extraction completed for {currentUpload.fileName}. 
                Review the extracted data below, then continue processing to apply MSCC5 classification and store in database.
              </p>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => continueProcessingMutation.mutate(selectedUploadId)}
                  disabled={continueProcessingMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {continueProcessingMutation.isPending ? "Processing..." : "Continue Processing"}
                </Button>
                
                <Button
                  asChild
                  variant="outline"
                >
                  <Link href="/upload">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Upload
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Section Inspection Data
            {expandedSectionData && (
              <Badge variant="outline" className="ml-2">
                {expandedSectionData.length} Sections
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

          {selectedUploadId && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Database className="h-5 w-5" />
                <h3 className="text-lg font-semibold">
                  Section Inspection Data ({expandedSectionData?.length || 0} Sections)
                </h3>
              </div>
              
              {/* Dashboard Table Template */}
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                          Item No
                        </th>
                        <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                          Inspec. No
                        </th>
                        <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                          Project No
                        </th>
                        <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                          Date
                        </th>
                        <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                          Time
                        </th>
                        <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                          Start MH
                        </th>
                        <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                          Start MH Depth
                        </th>
                        <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                          Finish MH
                        </th>
                        <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                          Finish MH Depth
                        </th>
                        <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                          Pipe Size
                        </th>
                        <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                          Material
                        </th>
                        <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                          Total Length
                        </th>
                        <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                          Length Surveyed
                        </th>
                        <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                          Severity Grade
                        </th>
                        <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                          SRM Grading
                        </th>
                        <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-96">
                          Observations
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {expandedSectionData && expandedSectionData.length > 0 ? expandedSectionData.map((section: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-1 py-2 text-center text-xs w-16">
                            <div className="font-medium">{section.itemNo}</div>
                          </td>
                          <td className="px-1 py-2 text-center text-xs w-16">
                            {section.inspectionNo}
                          </td>
                          <td className="px-1 py-2 text-center text-xs w-20">
                            {section.projectNo || 'N/A'}
                          </td>
                          <td className="px-1 py-2 text-center text-xs w-20">
                            {section.date || 'N/A'}
                          </td>
                          <td className="px-1 py-2 text-center text-xs w-20">
                            {section.time || 'N/A'}
                          </td>
                          <td className="px-1 py-2 text-center text-xs w-20">
                            {section.startMH}
                          </td>
                          <td className="px-1 py-2 text-center text-xs w-20">
                            {section.startMHDepth}
                          </td>
                          <td className="px-1 py-2 text-center text-xs w-20">
                            {section.finishMH}
                          </td>
                          <td className="px-1 py-2 text-center text-xs w-20">
                            {section.finishMHDepth}
                          </td>
                          <td className="px-1 py-2 text-center text-xs w-20">
                            {section.pipeSize}mm
                          </td>
                          <td className="px-1 py-2 text-center text-xs w-32">
                            {section.pipeMaterial}
                          </td>
                          <td className="px-1 py-2 text-center text-xs w-20">
                            {section.totalLength}
                          </td>
                          <td className="px-1 py-2 text-center text-xs w-20">
                            {section.lengthSurveyed}
                          </td>
                          <td className="px-1 py-2 text-center text-xs w-20">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              section.severityGrade === '0' ? 'bg-green-100 text-green-800' :
                              section.severityGrade === '1' ? 'bg-red-100 text-red-800' :
                              section.severityGrade === '2' ? 'bg-amber-100 text-amber-800' :
                              section.severityGrade === '3' ? 'bg-red-100 text-red-800' :
                              section.severityGrade === '4' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              Grade {section.severityGrade}
                            </span>
                          </td>
                          <td className="px-1 py-2 text-center text-xs w-20">
                            <div className="text-xs">
                              {section.severityGrade === "0" ? "No service issues" :
                               section.severityGrade === "1" ? "Minor service impacts" :
                               section.severityGrade === "2" ? "Moderate service defects" :
                               section.severityGrade === "3" ? "Major service defects" :
                               "Blocked or non-functional"}
                            </div>
                          </td>
                          <td className="px-1 py-2 text-xs w-96">
                            <div className="text-sm leading-relaxed">
                              {section.defects}
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={15} className="px-4 py-8 text-center text-gray-500">
                            {selectedUploadId ? 'Loading sections data...' : 'Select a PDF file to view sections'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}