import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';

interface ValidationIssue {
  id: string;
  type: 'error' | 'warning';
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ValidationWarningPopupProps {
  issue: ValidationIssue | null;
  currentIndex: number;
  totalCount: number;
  onNext: () => void;
  onDismissAll: () => void;
  isVisible: boolean;
}

export function ValidationWarningPopup({
  issue,
  currentIndex,
  totalCount,
  onNext,
  onDismissAll,
  isVisible
}: ValidationWarningPopupProps) {
  if (!isVisible || !issue) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className={`h-5 w-5 ${issue.type === 'error' ? 'text-red-500' : 'text-yellow-500'}`} />
              <CardTitle className="text-lg">{issue.title}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismissAll}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {totalCount > 1 && (
            <div className="text-sm text-muted-foreground">
              Issue {currentIndex + 1} of {totalCount}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <CardDescription className="text-sm">
            {issue.description.includes('Item ') ? (
              <div>
                {issue.description.split('\n\n').map((section, index) => {
                  if (section.includes('Item ')) {
                    // Format as list for TP2 items
                    const lines = section.split('\n');
                    const title = lines[0];
                    const items = lines.slice(1);
                    return (
                      <div key={index} className="mb-3">
                        <div className="mb-2">{title}</div>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          {items.map((item, itemIndex) => (
                            <li key={itemIndex} className="text-sm">{item}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  } else {
                    // Regular paragraph
                    return <div key={index} className="mb-2">{section}</div>;
                  }
                })}
              </div>
            ) : (
              issue.description
            )}
          </CardDescription>
          
          <div className="flex justify-between space-x-2">
            <div>
              {issue.action && (
                <Button
                  onClick={issue.action.onClick}
                  variant={issue.action.label === "Re-calculate" ? "default" : "outline"}
                  size="sm"
                  className={issue.action.label === "Re-calculate" ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                >
                  {issue.action.label}
                </Button>
              )}
            </div>
            <div className="space-x-2">
              <Button
                onClick={onDismissAll}
                variant="ghost"
                size="sm"
              >
                Dismiss All
              </Button>
              {currentIndex < totalCount - 1 ? (
                <Button
                  onClick={onNext}
                  size="sm"
                >
                  Next Issue
                </Button>
              ) : (
                <Button
                  onClick={onDismissAll}
                  size="sm"
                >
                  Done
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}