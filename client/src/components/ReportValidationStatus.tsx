import { useState } from 'react';
import { CheckCircle, AlertTriangle, Clock, Settings, Calculator } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { ValidationResult, ValidationIssue } from '@shared/report-validation';

interface ReportValidationStatusProps {
  validationResult: ValidationResult;
  onResolveConfiguration: (itemIds: number[]) => void;
  onAdjustRates: (defectType: 'service' | 'structural', newRate: number) => void;
  onSplitTravelCosts: (defectType: 'service' | 'structural', costPerItem: number) => void;
  onExportReport: () => void;
}

export function ReportValidationStatus({
  validationResult,
  onResolveConfiguration,
  onAdjustRates,
  onSplitTravelCosts,
  onExportReport
}: ReportValidationStatusProps) {
  const [showRateDialog, setShowRateDialog] = useState(false);
  const [showTravelDialog, setShowTravelDialog] = useState(false);
  const [activeIssue, setActiveIssue] = useState<ValidationIssue | null>(null);

  const getStatusIcon = () => {
    if (validationResult.isReady) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    const hasErrors = validationResult.issues.some(issue => issue.severity === 'error');
    return hasErrors ? 
      <AlertTriangle className="h-5 w-5 text-red-600" /> : 
      <Clock className="h-5 w-5 text-yellow-600" />;
  };

  const getStatusColor = () => {
    if (validationResult.isReady) return "border-green-200 bg-green-50";
    const hasErrors = validationResult.issues.some(issue => issue.severity === 'error');
    return hasErrors ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50";
  };

  const handleRateAdjustment = (issue: ValidationIssue) => {
    setActiveIssue(issue);
    setShowRateDialog(true);
  };

  const handleTravelCostSplit = (issue: ValidationIssue) => {
    setActiveIssue(issue);
    setShowTravelDialog(true);
  };

  const confirmRateAdjustment = () => {
    if (activeIssue && activeIssue.calculatedValue) {
      const defectType = activeIssue.message.includes('service') ? 'service' : 'structural';
      onAdjustRates(defectType, activeIssue.calculatedValue);
    }
    setShowRateDialog(false);
    setActiveIssue(null);
  };

  const confirmTravelCostSplit = () => {
    if (activeIssue && activeIssue.calculatedValue) {
      const defectType = activeIssue.message.includes('service') ? 'service' : 'structural';
      onSplitTravelCosts(defectType, activeIssue.calculatedValue);
    }
    setShowTravelDialog(false);
    setActiveIssue(null);
  };

  return (
    <div className="space-y-4" data-component="report-validation-status">
      {/* Main Status Alert */}
      <Alert 
        className={getStatusColor()}
        data-validation-status={validationResult.isReady ? "ready" : "pending"}
        data-issue-count={validationResult.issues.length}
      >
        {getStatusIcon()}
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{validationResult.summary}</p>
              {validationResult.issues.length > 0 && (
                <p className="text-sm mt-1">
                  {validationResult.issues.length} issue{validationResult.issues.length !== 1 ? 's' : ''} requiring attention
                </p>
              )}
            </div>
            {validationResult.isReady && (
              <Button 
                onClick={onExportReport}
                className="bg-green-600 hover:bg-green-700 text-white"
                data-action="export-report"
                data-validation-ready="true"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>

      {/* Individual Issues */}
      {validationResult.issues.map((issue, index) => (
        <Alert 
          key={index} 
          className="border-l-4 border-l-blue-500"
          data-issue-type={issue.type}
          data-issue-severity={issue.severity}
          data-issue-index={index}
          data-item-ids={issue.itemIds?.join(',')}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {issue.type === 'configuration' && <Settings className="h-4 w-4" data-icon="settings" />}
                {issue.type === 'quantity' && <Calculator className="h-4 w-4" data-icon="calculator" />}
                {issue.type === 'travel' && <Clock className="h-4 w-4" data-icon="clock" />}
                {issue.type === 'vehicle' && <AlertTriangle className="h-4 w-4" data-icon="alert-triangle" />}
                <Badge 
                  variant={issue.severity === 'error' ? 'destructive' : 'secondary'}
                  data-badge-type={issue.type}
                  data-badge-severity={issue.severity}
                >
                  {issue.type}
                </Badge>
              </div>
              <p className="font-medium" data-field="issue-message">{issue.message}</p>
              {issue.itemIds && (
                <p className="text-sm text-gray-600 mt-1" data-field="affected-items">
                  Items: {issue.itemIds.join(', ')}
                </p>
              )}
              {issue.suggestedAction && (
                <p className="text-sm text-blue-600 mt-1">
                  💡 {issue.suggestedAction}
                </p>
              )}
              {issue.calculatedValue && (
                <p className="text-sm font-medium text-green-600 mt-1">
                  Suggested value: £{issue.calculatedValue.toFixed(2)}
                </p>
              )}
            </div>
            
            <div className="flex gap-2 ml-4" data-section="action-buttons">
              {issue.type === 'configuration' && issue.itemIds && (
                <Button 
                  size="sm" 
                  onClick={() => onResolveConfiguration(issue.itemIds!)}
                  data-action="setup-configs"
                  data-issue-type="configuration"
                  data-affected-items={issue.itemIds.join(',')}
                >
                  Setup Configs
                </Button>
              )}
              
              {issue.type === 'quantity' && issue.calculatedValue && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleRateAdjustment(issue)}
                  data-action="adjust-day-rate"
                  data-issue-type="quantity"
                  data-calculated-value={issue.calculatedValue}
                >
                  Adjust day rate to meet minimum requirements
                </Button>
              )}
              
              {issue.type === 'travel' && issue.calculatedValue && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleTravelCostSplit(issue)}
                  data-action="split-travel-costs"
                  data-issue-type="travel"
                  data-calculated-value={issue.calculatedValue}
                >
                  Split Costs
                </Button>
              )}
              
              {issue.type === 'vehicle' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => window.location.href = '/customer-settings?tab=travel-rates'}
                  data-action="setup-travel-rates"
                  data-issue-type="vehicle"
                  data-navigation-target="/customer-settings?tab=travel-rates"
                >
                  Set up vehicle travel rates for: CCTV, Patching, Patching, Patching, CCTV
                </Button>
              )}
            </div>
          </div>
        </Alert>
      ))}

      {/* Rate Adjustment Dialog */}
      <Dialog open={showRateDialog} onOpenChange={setShowRateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Day Rate</DialogTitle>
            <DialogDescription>
              Quantities are below minimum requirements. Adjust the day rate to meet requirements?
            </DialogDescription>
          </DialogHeader>
          
          {activeIssue && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="font-medium">Current Issue:</p>
                <p className="text-sm">{activeIssue.message}</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="font-medium">Suggested Solution:</p>
                <p className="text-sm">
                  New Rate: £{activeIssue.calculatedValue?.toFixed(2)} 
                  (Day Rate ÷ Number of Items)
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  This will make prices turn black and meet minimum requirements
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRateDialog(false)}>
              No, keep current
            </Button>
            <Button onClick={confirmRateAdjustment}>
              Yes, adjust rate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Travel Cost Split Dialog */}
      <Dialog open={showTravelDialog} onOpenChange={setShowTravelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Split Travel Costs</DialogTitle>
            <DialogDescription>
              Project is outside 2-hour travel radius. Split additional costs across repairs?
            </DialogDescription>
          </DialogHeader>
          
          {activeIssue && (
            <div className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="font-medium">Travel Issue:</p>
                <p className="text-sm">{activeIssue.message}</p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="font-medium">Cost Allocation:</p>
                <p className="text-sm">
                  £{activeIssue.calculatedValue?.toFixed(2)} per item
                  (Additional Travel Cost ÷ Number of Items)
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  This will integrate travel costs into individual item pricing
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTravelDialog(false)}>
              No, separate charge
            </Button>
            <Button onClick={confirmTravelCostSplit}>
              Yes, split costs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}