import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";
import fs from 'fs';
import path from 'path';

// Create fallback SQLite database when Neon is unavailable
const dbPath = path.join(process.cwd(), 'fallback.db');

// Initialize SQLite database
export const fallbackDb = new Database(dbPath);

// Enable WAL mode for better performance
fallbackDb.pragma('journal_mode = WAL');

export const db = drizzle(fallbackDb, { schema });

// Create tables if they don't exist
export async function initializeFallbackDatabase() {
  console.log('🔄 Initializing fallback SQLite database...');
  
  // Create basic tables for immediate functionality
  try {
    fallbackDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        first_name TEXT,
        last_name TEXT,
        profile_image_url TEXT,
        company TEXT,
        company_address TEXT,
        phone_number TEXT,
        role TEXT DEFAULT 'user',
        admin_id TEXT,
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        subscription_status TEXT DEFAULT 'none',
        payment_method_id TEXT,
        trial_reports_used INTEGER DEFAULT 0,
        is_test_user BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        last_login_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS project_folders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        folder_name TEXT NOT NULL,
        project_address TEXT NOT NULL,
        project_postcode TEXT,
        project_number TEXT,
        travel_distance DECIMAL(5,2),
        travel_time INTEGER,
        address_validated BOOLEAN DEFAULT false,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS file_uploads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        folder_id INTEGER,
        file_name TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        file_type TEXT NOT NULL,
        file_path TEXT NOT NULL,
        sector TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        report_url TEXT,
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
        file_upload_id INTEGER NOT NULL,
        item_no INTEGER NOT NULL,
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
      
      CREATE TABLE IF NOT EXISTS section_defects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_upload_id INTEGER NOT NULL,
        item_no INTEGER NOT NULL,
        defect_sequence INTEGER NOT NULL,
        defect_code TEXT NOT NULL,
        meterage TEXT,
        percentage TEXT,
        description TEXT,
        mscc5_grade INTEGER,
        defect_type TEXT,
        recommendation TEXT,
        operation_type TEXT,
        estimated_cost TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Insert test user if not exists
    const userExists = fallbackDb.prepare('SELECT COUNT(*) as count FROM users WHERE id = ?').get('test-user');
    if (userExists?.count === 0) {
      fallbackDb.prepare(`
        INSERT INTO users (id, email, first_name, last_name, is_test_user)
        VALUES (?, ?, ?, ?, ?)
      `).run('test-user', 'test@example.com', 'Test', 'User', 1);
    }
    
    console.log('✅ Fallback database initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing fallback database:', error);
    return false;
  }
}