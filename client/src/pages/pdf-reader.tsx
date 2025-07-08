import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Eye, Database, AlertTriangle, CheckCircle, Play, ArrowLeft, Home, RefreshCw } from 'lucide-react';
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
      projectNumber: section.projectNo || section.projectNumber || "no data recorded", // Use authentic project number from database
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

  // Display Section 1 data in console for user verification
  if (expandedSectionData?.[0]) {
    console.log('SECTION 1 DATA FOR USER VERIFICATION:', {
      projectNumber: expandedSectionData[0].projectNo || expandedSectionData[0].projectNumber,
      itemNo: expandedSectionData[0].itemNo,
      inspectionNo: expandedSectionData[0].inspectionNo,
      date: expandedSectionData[0].date,
      time: expandedSectionData[0].time,
      startMH: expandedSectionData[0].startMH,
      finishMH: expandedSectionData[0].finishMH,
      pipeSize: expandedSectionData[0].pipeSize,
      pipeMaterial: expandedSectionData[0].pipeMaterial,
      totalLength: expandedSectionData[0].totalLength,
      lengthSurveyed: expandedSectionData[0].lengthSurveyed,
      defects: expandedSectionData[0].defects,
      severityGrade: expandedSectionData[0].severityGrade
    });
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
              <FileText className="h-8 w-8 text-blue-600" />
              PDF Reader & Analysis
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Analyze PDF content before database insertion to identify extraction errors
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              asChild
              variant="outline"
            >
              <Link href="/upload">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Upload
              </Link>
            </Button>
            
            <Button
              asChild
              variant="outline"
            >
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* File Selection - DEBUG INFO */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select PDF File to Analyze (Upload ID: {selectedUploadId || 'None'})</CardTitle>
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
                
                <Button
                  asChild
                  variant="outline"
                >
                  <Link href="/">
                    <Home className="h-4 w-4 mr-2" />
                    Home
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Section Inspection Data
              {expandedSectionData && (
                <Badge variant="outline" className="ml-2">
                  {expandedSectionData.length} Sections
                </Badge>
              )}
            </CardTitle>
            
            {/* Refresh Button */}
            <Button
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['/api/uploads'] });
                if (selectedUploadId) {
                  queryClient.invalidateQueries({ queryKey: [`/api/uploads/${selectedUploadId}/sections`] });
                }
                toast({
                  title: "Data Refreshed",
                  description: "PDF Reader data has been refreshed"
                });
              }}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </Button>
          </div>
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
                  Section Inspection Data ({expandedSectionData?.length || 0} Sections) - PDF Reader Display
                </h3>
                <div className="text-sm text-gray-500 ml-4">
                  Upload: {selectedUploadId} | Raw Data: {sectionData?.length || 0} | Expanded: {expandedSectionData?.length || 0}
                </div>
              </div>
              
              {/* Dashboard Table Template - EXACT MATCH */}
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-purple-50">
                      <tr>
                        <th className="px-2 py-3 text-center text-xs font-semibold text-gray-800 uppercase tracking-wider border-r border-gray-300 w-20" style={{ whiteSpace: 'nowrap' }}>
                          Project No
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-semibold text-gray-800 uppercase tracking-wider border-r border-gray-300 w-16" style={{ whiteSpace: 'nowrap' }}>
                          Item No
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-semibold text-gray-800 uppercase tracking-wider border-r border-gray-300 w-16" style={{ whiteSpace: 'nowrap' }}>
                          Inspec. No
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-semibold text-gray-800 uppercase tracking-wider border-r border-gray-300 w-20" style={{ whiteSpace: 'nowrap' }}>
                          Date
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-semibold text-gray-800 uppercase tracking-wider border-r border-gray-300 w-20" style={{ whiteSpace: 'nowrap' }}>
                          Time
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-semibold text-gray-800 uppercase tracking-wider border-r border-gray-300 w-20" style={{ whiteSpace: 'nowrap' }}>
                          Start MH
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-semibold text-gray-800 uppercase tracking-wider border-r border-gray-300 w-20" style={{ whiteSpace: 'nowrap' }}>
                          Start MH Depth
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-semibold text-gray-800 uppercase tracking-wider border-r border-gray-300 w-20" style={{ whiteSpace: 'nowrap' }}>
                          Finish MH
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-semibold text-gray-800 uppercase tracking-wider border-r border-gray-300 w-20" style={{ whiteSpace: 'nowrap' }}>
                          Finish MH Depth
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-semibold text-gray-800 uppercase tracking-wider border-r border-gray-300 w-20" style={{ whiteSpace: 'nowrap' }}>
                          Pipe Size
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-semibold text-gray-800 uppercase tracking-wider border-r border-gray-300 w-32" style={{ whiteSpace: 'nowrap' }}>
                          Pipe Material
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-semibold text-gray-800 uppercase tracking-wider border-r border-gray-300 w-20" style={{ whiteSpace: 'nowrap' }}>
                          Total Length (m)
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-semibold text-gray-800 uppercase tracking-wider border-r border-gray-300 w-20" style={{ whiteSpace: 'nowrap' }}>
                          Length Surveyed (m)
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-semibold text-gray-800 uppercase tracking-wider border-r border-gray-300 w-96" style={{ whiteSpace: 'nowrap' }}>
                          Observations
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-semibold text-gray-800 uppercase tracking-wider border-r border-gray-300 w-20" style={{ whiteSpace: 'nowrap' }}>
                          Severity Grade
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-semibold text-gray-800 uppercase tracking-wider w-20" style={{ whiteSpace: 'nowrap' }}>
                          SRM Grading
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {expandedSectionData && expandedSectionData.length > 0 ? expandedSectionData.map((section: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-50 text-center">
                          <td className="px-2 py-2 text-xs border-r border-gray-200 w-20 font-medium">
                            {section.projectNo || section.projectNumber || 'ECL NEWARK'}
                          </td>
                          <td className="px-2 py-2 text-xs border-r border-gray-200 font-medium w-16">
                            {section.itemNo}
                          </td>
                          <td className="px-2 py-2 text-xs border-r border-gray-200 w-16">
                            {section.inspectionNo}
                          </td>
                          <td className="px-2 py-2 text-xs border-r border-gray-200 w-20">
                            {section.date || 'no data recorded'}
                          </td>
                          <td className="px-2 py-2 text-xs border-r border-gray-200 w-20">
                            {section.time || 'no data recorded'}
                          </td>
                          <td className="px-2 py-2 text-xs border-r border-gray-200 w-20 font-medium">
                            {section.startMH}
                          </td>
                          <td className="px-2 py-2 text-xs border-r border-gray-200 w-20">
                            {section.startMHDepth}
                          </td>
                          <td className="px-2 py-2 text-xs border-r border-gray-200 w-20 font-medium">
                            {section.finishMH}
                          </td>
                          <td className="px-2 py-2 text-xs border-r border-gray-200 w-20">
                            {section.finishMHDepth}
                          </td>
                          <td className="px-2 py-2 text-xs border-r border-gray-200 w-20 font-medium">
                            {section.pipeSize}
                          </td>
                          <td className="px-2 py-2 text-xs border-r border-gray-200 w-32">
                            {section.pipeMaterial}
                          </td>
                          <td className="px-2 py-2 text-xs border-r border-gray-200 w-20">
                            {section.totalLength}
                          </td>
                          <td className="px-2 py-2 text-xs border-r border-gray-200 w-20">
                            {section.lengthSurveyed}
                          </td>
                          <td className="px-2 py-2 text-xs border-r border-gray-200 w-96">
                            <div className="text-xs text-left leading-relaxed">
                              {section.defects || 'no data recorded'}
                            </div>
                          </td>
                          <td className="px-2 py-2 text-xs border-r border-gray-200 w-20">
                            <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                              section.severityGrade === '0' ? 'bg-green-100 text-green-800' :
                              section.severityGrade === '1' ? 'bg-red-100 text-red-800' :
                              section.severityGrade === '2' ? 'bg-amber-100 text-amber-800' :
                              section.severityGrade === '3' ? 'bg-red-100 text-red-800' :
                              section.severityGrade === '4' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {section.severityGrade || '0'}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-xs w-20">
                            <div className="text-xs">
                              {section.severityGrade === "0" ? "No service issues" :
                               section.severityGrade === "1" ? "Minor service impacts" :
                               section.severityGrade === "2" ? "Moderate service defects" :
                               section.severityGrade === "3" ? "Major service defects" :
                               section.severityGrade === "4" ? "Critical defects" :
                               "No service issues"}
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={16} className="px-4 py-8 text-center text-gray-500">
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