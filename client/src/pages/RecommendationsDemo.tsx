import React, { useState } from "react";
import RecommendationsCard from "@/components/RecommendationsCard";

export default function RecommendationsDemo() {
  const [selectedSection, setSelectedSection] = useState("1");

  const sections = [
    { id: "1", name: "Section 1 (SW001-SW002, 12.5m, 150mm PVC)" },
    { id: "2", name: "Section 2 (SW002-SW003, 18.2m, 225mm Concrete)" },
    { id: "3", name: "Section 3 (SW003-SW004, 25m, 300mm VC)" },
    { id: "TEST-001", name: "Test Section (MH001-MH002, 15.5m, 150mm PVC)" }
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Recommendations with Cost Analysis</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select Section:</label>
        <select 
          value={selectedSection} 
          onChange={(e) => setSelectedSection(e.target.value)}
          className="border rounded px-3 py-2 bg-white"
        >
          {sections.map(section => (
            <option key={section.id} value={section.id}>
              {section.name}
            </option>
          ))}
        </select>
      </div>

      <RecommendationsCard sectionId={selectedSection} />
      
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">API Endpoint Details</h3>
        <p className="text-sm text-gray-600">
          Current endpoint: <code>/api/sections/{selectedSection}/recommendations</code>
        </p>
        <p className="text-sm text-gray-600 mt-1">
          This demonstrates the integrated costing service with authentic unit rates and diameter/material multipliers.
        </p>
      </div>
    </div>
  );
}