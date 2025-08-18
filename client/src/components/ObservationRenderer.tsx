import React from 'react';

/**
 * Centralized observation renderer following PIN 7461 requirements
 * - Semantic <ul><li> for accessibility
 * - Consistent defect code bolding with <strong>
 * - Single bullet strategy across all observations
 * - No double-formatting (HTML only, no markdown)
 */

interface ObservationRendererProps {
  observations: string[];
  className?: string;
}

/**
 * Parse and format a single observation with defect code bolding
 */
const formatObservationItem = (observation: string): { code: string | null; text: string } => {
  const trimmed = observation.trim();
  
  // Extract defect codes at start of observation (common MSCC5 patterns)
  const defectCodePattern = /^("?([A-Z]{2,4})"?\s*[-–—]\s*)/;
  const codeMatch = trimmed.match(defectCodePattern);
  
  if (codeMatch) {
    const code = codeMatch[2]; // Extract just the code letters
    const text = trimmed.replace(defectCodePattern, '').trim();
    return { code, text };
  }
  
  // Check for embedded codes like "DER Settled deposits..." 
  const embeddedCodePattern = /^([A-Z]{2,4})\s+(.+)$/;
  const embeddedMatch = trimmed.match(embeddedCodePattern);
  
  if (embeddedMatch && ['DER', 'DES', 'WL', 'FC', 'FL', 'CR', 'DEF', 'JDL', 'JDS', 'JDM', 'OJM', 'OJL', 'CN', 'SC'].includes(embeddedMatch[1])) {
    return { code: embeddedMatch[1], text: embeddedMatch[2].trim() };
  }
  
  return { code: null, text: trimmed };
};

const ObservationRenderer: React.FC<ObservationRendererProps> = ({ 
  observations, 
  className = "observation-list" 
}) => {
  if (!observations || observations.length === 0) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        No observations recorded
      </div>
    );
  }

  return (
    <ul className={`observation-list list-none space-y-1 text-sm ${className}`}>
      {observations.map((observation, index) => {
        const { code, text } = formatObservationItem(observation);
        
        return (
          <li key={index} className="observation-item flex items-start">
            <span className="observation-bullet mr-2 text-gray-600 flex-shrink-0">•</span>
            <span className="observation-content break-words">
              {code ? (
                <>
                  <strong className="observation-code font-semibold">"{code}"</strong>
                  <span className="observation-text"> - {text}</span>
                </>
              ) : (
                <span className="observation-text">{text}</span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
};

export default ObservationRenderer;