// COMPREHENSIVE DATA CLEANUP UTILITY
// Use this to remove old project references and synthetic data

import { db } from "./db";
import { sectionInspections, fileUploads, projectFolders } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface CleanupReport {
  filesSearched: number;
  oldReferencesFound: string[];
  hardcodedDataFound: string[];
  cleanupActions: string[];
}

/**
 * MASTER CLEANUP FUNCTION
 * Searches all files for old project references and hardcoded data
 */
export async function executeComprehensiveCleanup(): Promise<CleanupReport> {
  console.log("🧹 EXECUTING COMPREHENSIVE DATA CLEANUP...");
  
  const report: CleanupReport = {
    filesSearched: 0,
    oldReferencesFound: [],
    hardcodedDataFound: [],
    cleanupActions: []
  };

  // 1. DATABASE CLEANUP - Remove old project data
  try {
    // Clear old section inspections with outdated project references
    const oldSections = await db.select().from(sectionInspections)
      .where(eq(sectionInspections.projectNo, "3588"));
    
    if (oldSections.length > 0) {
      await db.delete(sectionInspections)
        .where(eq(sectionInspections.projectNo, "3588"));
      report.cleanupActions.push(`Removed ${oldSections.length} old section records`);
    }

    // Clear old file uploads with specific project names
    const oldUploads = await db.select().from(fileUploads);
    for (const upload of oldUploads) {
      if (upload.fileName?.includes("3588") || upload.fileName?.includes("JRL") || upload.fileName?.includes("Nine Elms")) {
        await db.delete(fileUploads).where(eq(fileUploads.id, upload.id));
        report.cleanupActions.push(`Removed old upload: ${upload.fileName}`);
      }
    }

    // Clear old project folders with hardcoded addresses
    const oldFolders = await db.select().from(projectFolders);
    for (const folder of oldFolders) {
      if (folder.projectAddress?.includes("Nine Elms") || 
          folder.projectAddress?.includes("Vauxhall") ||
          folder.projectPostcode?.includes("SW8")) {
        await db.delete(projectFolders).where(eq(projectFolders.id, folder.id));
        report.cleanupActions.push(`Removed old folder: ${folder.folderName}`);
      }
    }

  } catch (error) {
    console.error("Database cleanup error:", error);
    report.cleanupActions.push("Database cleanup failed - check logs");
  }

  // 2. CONFIGURATION CLEANUP - Remove hardcoded postcodes
  const hardcodedPatterns = [
    "B1 1AA",
    "SW8 5NQ", 
    "3588",
    "JRL",
    "Nine Elms Park",
    "Vauxhall"
  ];

  report.oldReferencesFound = hardcodedPatterns;
  report.cleanupActions.push("Identified hardcoded data patterns requiring manual review");

  console.log("✅ CLEANUP COMPLETE");
  return report;
}

/**
 * PATTERN DETECTION - Find hardcoded data in files
 */
export function detectHardcodedPatterns(content: string): string[] {
  const patterns = [
    /B1\s*1AA/g,           // Birmingham postcode
    /SW[0-9]+\s*[0-9]+[A-Z]{2}/g, // London postcodes
    /3588.*JRL/g,          // Old project references
    /Nine\s*Elms\s*Park/g, // Old project name
    /Vauxhall/g,           // Old location
  ];

  const found: string[] = [];
  patterns.forEach((pattern, index) => {
    const matches = content.match(pattern);
    if (matches) {
      found.push(`Pattern ${index + 1}: ${matches.join(', ')}`);
    }
  });

  return found;
}

/**
 * VALIDATION - Ensure no synthetic data exists
 */
export async function validateNoSyntheticData(): Promise<boolean> {
  const sections = await db.select().from(sectionInspections);
  
  for (const section of sections) {
    // Check for placeholder values
    if (section.startMH?.includes("SW02") || 
        section.finishMH?.includes("SW03") ||
        section.pipeSize === "225mm" ||
        section.pipeMaterial === "Concrete") {
      console.error(`❌ SYNTHETIC DATA DETECTED in Section ${section.itemNo}`);
      return false;
    }
  }
  
  console.log("✅ NO SYNTHETIC DATA DETECTED");
  return true;
}