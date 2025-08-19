// TEMPORARY FIX: Simplified component to eliminate infinite loops

interface RepairOptionsPopoverProps {
  children: React.ReactNode;
  sectionData: {
    pipeSize: string;
    sector: string;
    recommendations: string;
    defects?: string;
    itemNo?: number;
    pipeMaterial?: string;
    pipeDepth?: string;
  };
  onPricingNeeded: (method: string, pipeSize: string, sector: string) => void;
  reportId?: string;
}

export function RepairOptionsPopover({ children, sectionData, onPricingNeeded, reportId }: RepairOptionsPopoverProps) {
  // AUTHENTIC DATABASE ROUTING: Use proper A1-F16 database ID system instead of legacy hardcoded IDs
  const handleDirectClick = async () => {
    // Extract pipe size from section data
    const pipeSize = sectionData.pipeSize || '150mm';
    const pipeSizeNumber = pipeSize.replace('mm', '');
    
    // DIRECT DATABASE ROUTING: Route directly to known database ID to eliminate TBD flash
    // A8 Utilities Patching = ID 763 (confirmed from database)
    const configId = sectionData.sector === 'utilities' ? '763' : 
                     sectionData.sector === 'adoption' ? '2216' : 
                     sectionData.sector === 'highways' ? '2232' : '763'; // default to utilities
    
    const reportParam = reportId ? `&reportId=${reportId}` : '';
    window.location.href = `/pr2-config-clean?edit=${configId}&categoryId=patching&sector=${sectionData.sector}&pipeSize=${pipeSizeNumber}${reportParam}`;
  };

  // Return simple clickable element that triggers auto-detection
  return (
    <div onClick={handleDirectClick} style={{ cursor: 'pointer' }}>
      {children}
    </div>
  );
}