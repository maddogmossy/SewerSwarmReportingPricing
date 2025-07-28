#!/usr/bin/env node

/**
 * Backup and Restore System for Configuration Management
 * Allows creating zip backups and restoring from them
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Folders to backup (critical project files)
const BACKUP_FOLDERS = [
  'client',
  'server', 
  'shared',
  'migrations',
  'uploads'
];

// Files to backup (configuration and important files)
const BACKUP_FILES = [
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'tsconfig.node.json',
  'vite.config.ts',
  'tailwind.config.ts',
  'drizzle.config.ts',
  'components.json',
  'replit.md',
  '.replit',
  'postcss.config.js'
];

function createBackup(backupName = null) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const name = backupName || `backup-${timestamp}`;
  const backupDir = `backups/${name}`;
  
  console.log(`📦 Creating backup: ${name}`);
  
  // Create backup directory
  if (!fs.existsSync('backups')) {
    fs.mkdirSync('backups');
  }
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Copy folders
  BACKUP_FOLDERS.forEach(folder => {
    if (fs.existsSync(folder)) {
      console.log(`📁 Backing up folder: ${folder}`);
      execSync(`cp -r ${folder} ${backupDir}/`);
    }
  });
  
  // Copy files
  BACKUP_FILES.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`📄 Backing up file: ${file}`);
      execSync(`cp ${file} ${backupDir}/`);
    }
  });
  
  // Create database dump
  try {
    console.log(`🗄️ Creating database backup...`);
    const dbBackup = execSync('pg_dump $DATABASE_URL', { encoding: 'utf8' });
    fs.writeFileSync(`${backupDir}/database-dump.sql`, dbBackup);
  } catch (error) {
    console.log(`⚠️ Database backup failed: ${error.message}`);
  }
  
  // Create tar.gz file (more reliable than zip in this environment)
  console.log(`🗜️ Creating tar.gz archive...`);
  execSync(`cd backups && tar -czf ${name}.tar.gz ${name}/`);
  
  // Remove uncompressed backup
  execSync(`rm -rf ${backupDir}`);
  
  console.log(`✅ Backup created: backups/${name}.tar.gz`);
  return `backups/${name}.tar.gz`;
}

function listBackups() {
  if (!fs.existsSync('backups')) {
    console.log('📂 No backups directory found');
    return [];
  }
  
  const files = fs.readdirSync('backups')
    .filter(file => file.endsWith('.tar.gz'))
    .map(file => {
      const stats = fs.statSync(`backups/${file}`);
      return {
        name: file,
        size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
        created: stats.mtime.toISOString()
      };
    });
  
  console.log('📋 Available backups:');
  files.forEach(file => {
    console.log(`  ${file.name} - ${file.size} - ${file.created}`);
  });
  
  return files;
}

function restoreFromBackup(backupName) {
  const backupPath = `backups/${backupName}`;
  
  if (!fs.existsSync(backupPath)) {
    console.log(`❌ Backup not found: ${backupPath}`);
    return false;
  }
  
  console.log(`🔄 Restoring from backup: ${backupName}`);
  
  // Extract backup
  const tempDir = `temp-restore-${Date.now()}`;
  execSync(`mkdir -p ${tempDir}`);
  execSync(`cd ${tempDir} && tar -xzf ../${backupPath}`);
  
  // Find the extracted folder
  const extractedContents = fs.readdirSync(tempDir);
  const backupDir = `${tempDir}/${extractedContents[0]}`;
  
  // Restore folders
  BACKUP_FOLDERS.forEach(folder => {
    const sourcePath = `${backupDir}/${folder}`;
    if (fs.existsSync(sourcePath)) {
      console.log(`📁 Restoring folder: ${folder}`);
      // Remove existing folder and replace
      if (fs.existsSync(folder)) {
        execSync(`rm -rf ${folder}`);
      }
      execSync(`cp -r ${sourcePath} ./`);
    }
  });
  
  // Restore files
  BACKUP_FILES.forEach(file => {
    const sourcePath = `${backupDir}/${file}`;
    if (fs.existsSync(sourcePath)) {
      console.log(`📄 Restoring file: ${file}`);
      execSync(`cp ${sourcePath} ./`);
    }
  });
  
  // Restore database if backup exists
  const dbBackupPath = `${backupDir}/database-dump.sql`;
  if (fs.existsSync(dbBackupPath)) {
    try {
      console.log(`🗄️ Restoring database...`);
      // Drop and recreate database tables, then restore
      execSync(`psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`);
      execSync(`psql $DATABASE_URL < ${dbBackupPath}`);
      console.log(`✅ Database restored`);
    } catch (error) {
      console.log(`⚠️ Database restore failed: ${error.message}`);
    }
  }
  
  // Clean up temp directory
  execSync(`rm -rf ${tempDir}`);
  
  console.log(`✅ Restore completed from: ${backupName}`);
  return true;
}

// Command line interface
const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'create':
    createBackup(arg);
    break;
  case 'list':
    listBackups();
    break;
  case 'restore':
    if (!arg) {
      console.log('❌ Please specify backup name to restore');
      console.log('Usage: node backup-system.js restore <backup-name.tar.gz>');
    } else {
      restoreFromBackup(arg);
    }
    break;
  default:
    console.log('🔧 Backup System Commands:');
    console.log('  create [name]     - Create new backup');
    console.log('  list             - List available backups');
    console.log('  restore <name>   - Restore from backup');
    console.log('');
    console.log('Examples:');
    console.log('  node backup-system.js create mmp1-stable');
    console.log('  node backup-system.js list');
    console.log('  node backup-system.js restore mmp1-stable.tar.gz');
}