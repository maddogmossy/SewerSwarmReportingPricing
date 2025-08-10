// Temporary database fallback for when Neon endpoint is disabled
// This preserves all existing data structures and can be easily switched back

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let fallbackDb = null;

export function initTempDatabase() {
  if (fallbackDb) return fallbackDb;
  
  const dbPath = path.join(process.cwd(), 'temp-fallback.db');
  console.log('🔄 Creating temporary SQLite database for dashboard...');
  
  fallbackDb = new Database(dbPath);
  fallbackDb.pragma('journal_mode = WAL');
  
  // Create minimal tables to match existing structure
  fallbackDb.exec(`
    CREATE TABLE IF NOT EXISTS file_uploads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT DEFAULT 'test-user',
      folder_id INTEGER,
      file_name TEXT NOT NULL,
      file_size INTEGER,
      file_type TEXT,
      file_path TEXT,
      sector TEXT DEFAULT 'utilities',
      status TEXT DEFAULT 'completed',
      project_number TEXT,
      visit_number INTEGER DEFAULT 1,
      site_address TEXT,
      site_postcode TEXT,
      extracted_data TEXT,
      database_format TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS section_inspections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_upload_id INTEGER,
      item_no INTEGER,
      letter_suffix TEXT,
      inspection_no INTEGER DEFAULT 1,
      project_no TEXT,
      date TEXT,
      time TEXT,
      start_mh TEXT,
      start_mh_depth TEXT,
      finish_mh TEXT,
      finish_mh_depth TEXT,
      pipe_size TEXT,
      pipe_material TEXT,
      total_length TEXT,
      length_surveyed TEXT,
      defects TEXT,
      defect_type TEXT,
      severity_grade TEXT,
      severity_grades TEXT,
      recommendations TEXT,
      adoptable TEXT,
      cost TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS project_folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT DEFAULT 'test-user',
      folder_name TEXT,
      project_address TEXT,
      project_postcode TEXT,
      project_number TEXT,
      travel_distance DECIMAL(5,2),
      travel_time INTEGER,
      address_validated BOOLEAN DEFAULT false,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  return fallbackDb;
}

export function insertTempUpload(data) {
  const db = initTempDatabase();
  const stmt = db.prepare(`
    INSERT INTO file_uploads (file_name, file_size, file_type, file_path, sector, status, project_number, extracted_data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  return stmt.run(
    data.fileName,
    data.fileSize || 0,
    data.fileType || 'application/octet-stream',
    data.filePath,
    data.sector || 'utilities',
    data.status || 'completed',
    data.projectNumber || null,
    data.extractedData || null
  );
}

export function getTempUploads() {
  const db = initTempDatabase();
  const stmt = db.prepare('SELECT * FROM file_uploads ORDER BY created_at DESC');
  return stmt.all();
}

export function getTempSections(uploadId) {
  const db = initTempDatabase();
  const stmt = db.prepare('SELECT * FROM section_inspections WHERE file_upload_id = ? ORDER BY item_no ASC');
  return stmt.all(uploadId);
}

export function insertTempSections(sections, uploadId) {
  const db = initTempDatabase();
  const stmt = db.prepare(`
    INSERT INTO section_inspections 
    (file_upload_id, item_no, letter_suffix, project_no, date, time, start_mh, start_mh_depth, 
     finish_mh, finish_mh_depth, pipe_size, pipe_material, total_length, length_surveyed, 
     defects, defect_type, severity_grade, severity_grades, recommendations, adoptable, cost)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const insertMany = db.transaction((sections) => {
    for (const section of sections) {
      stmt.run(
        uploadId,
        section.itemNo,
        section.letterSuffix || null,
        section.projectNo || null,
        section.date || null,
        section.time || null,
        section.startMH || null,
        section.startMHDepth || null,
        section.finishMH || null,
        section.finishMHDepth || null,
        section.pipeSize || null,
        section.pipeMaterial || null,
        section.totalLength || null,
        section.lengthSurveyed || null,
        section.defects || null,
        section.defectType || null,
        section.severityGrade || null,
        JSON.stringify(section.severityGrades) || null,
        section.recommendations || null,
        section.adoptable || null,
        section.cost || null
      );
    }
  });
  
  insertMany(sections);
}