import { useState, useCallback } from 'react';

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

export function useValidationWarnings() {
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const showWarnings = useCallback((newIssues: ValidationIssue[]) => {
    if (newIssues.length > 0) {
      setIssues(newIssues);
      setCurrentIndex(0);
      setIsVisible(true);
    }
  }, []);

  const dismissAll = useCallback(() => {
    setIsVisible(false);
    setIssues([]);
    setCurrentIndex(0);
  }, []);

  const nextIssue = useCallback(() => {
    if (currentIndex < issues.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      dismissAll();
    }
  }, [currentIndex, issues.length, dismissAll]);

  return {
    currentIssue: isVisible && issues.length > 0 ? issues[currentIndex] : null,
    currentIndex,
    totalCount: issues.length,
    isVisible,
    showWarnings,
    dismissAll,
    nextIssue
  };
}