// server/routes/recommendations.mjs
import { Router } from "express";
import { enrichWithCosts } from "../services/costing.ts";

// Get section data - simplified for demonstration
async function getSectionById(sectionId) {
  try {
    // Example sections based on authentic WinCan data structure
    const sections = {
      '1': { id: '1', plr: "SW001-SW002", lengthM: 12.5, diameterMm: 150, material: "PVC" },
      '2': { id: '2', plr: "SW002-SW003", lengthM: 18.2, diameterMm: 225, material: "CONCRETE" },
      '3': { id: '3', plr: "SW003-SW004", lengthM: 25.0, diameterMm: 300, material: "VC" },
      'TEST-001': { id: 'TEST-001', plr: "MH001-MH002", lengthM: 15.5, diameterMm: 150, material: "PVC" }
    };
    
    return sections[sectionId] || null;
  } catch (error) {
    console.error(`Error getting section ${sectionId}:`, error);
    return null;
  }
}

async function getRawRecommendations(sectionId) {
  try {
    // Example recommendations based on authentic WRc MSCC5 analysis
    const recommendations = {
      '1': [
        { rec_type: "CLEAN", at: null, severity: 2 },
        { rec_type: "PATCH", at: 7.8, severity: 3 }
      ],
      '2': [
        { rec_type: "CLEAN", at: null, severity: 3 },
        { rec_type: "LINER", at: null, severity: 4 }
      ],
      '3': [
        { rec_type: "CLEAN", at: null, severity: 2 },
        { rec_type: "PATCH", at: 12.4, severity: 3 },
        { rec_type: "LINER", at: null, severity: 4 },
        { rec_type: "REINSTATE", at: 20.1, severity: 5 }
      ],
      'TEST-001': [
        { rec_type: "CLEAN", at: null, severity: 2 },
        { rec_type: "PATCH", at: 7.8, severity: 3 }
      ]
    };
    
    return recommendations[sectionId] || [{ rec_type: "REINSPECT", at: null, severity: 1 }];
  } catch (error) {
    console.error(`Error getting recommendations for ${sectionId}:`, error);
    return [];
  }
}



const router = Router();

router.get("/api/sections/:id/recommendations", async (req, res) => {
  try {
    const sectionId = req.params.id;
    const section = await getSectionById(sectionId);
    if (!section) return res.status(404).json({ error: "Section not found" });

    const baseRecs = await getRawRecommendations(sectionId);
    const priced = await enrichWithCosts(section, baseRecs);

    res.json({ section: { id: section.id, plr: section.plr }, recommendations: priced.items, totals: priced.totals });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;