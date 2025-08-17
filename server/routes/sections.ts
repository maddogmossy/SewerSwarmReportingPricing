/**
 * Sections API - Clean processing endpoints
 */

import { Request, Response, Express } from 'express';
import { db } from '../db';
import { sectionInspections } from '@shared/schema';
import { eq } from 'drizzle-orm';
// import { SectionProcessor } from '../section-processor';
// import { RawDataMigrator } from '../raw-data-migrator';

export function registerSectionRoutes(app: Express) {
  
  // Get sections with on-demand processing
  app.get('/api/uploads/:uploadId/sections', async (req: Request, res: Response) => {
    try {
      const uploadId = parseInt(req.params.uploadId);
      const forceReprocess = req.query.reprocess === 'true';
      
      console.log(`🔍 SECTIONS API - Fetching sections for upload ${uploadId}`);
      
      // Get raw sections from database
      const sections = await db.select()
        .from(sectionInspections)
        .where(eq(sectionInspections.fileUploadId, uploadId));
      
      console.log(`🔍 SECTIONS API - Found ${sections.length} sections total`);
      
      // Check if we need to migrate to raw data format
      const needsMigration = sections.some(section => !section.rawObservations || section.rawObservations.length === 0);
      
      if (needsMigration) {
        console.log(`🔄 SECTIONS API - Migrating to raw data format`);
        await RawDataMigrator.migrateUpload(uploadId);
        
        // Refetch after migration
        const migratedSections = await db.select()
          .from(sectionInspections)
          .where(eq(sectionInspections.fileUploadId, uploadId));
        
        return res.json(migratedSections);
      }
      
      // Force reprocessing if requested
      if (forceReprocess) {
        console.log(`🔄 SECTIONS API - Force reprocessing requested`);
        await SectionProcessor.processUploadSections(uploadId);
        
        // Refetch processed data
        const reprocessedSections = await db.select()
          .from(sectionInspections)
          .where(eq(sectionInspections.fileUploadId, uploadId));
        
        return res.json(reprocessedSections);
      }
      
      res.json(sections);
      
    } catch (error) {
      console.error('❌ SECTIONS API - Error:', error);
      res.status(500).json({ error: 'Failed to fetch sections' });
    }
  });
  
  // Process specific section with current MSCC5 rules
  app.post('/api/sections/:sectionId/process', async (req: Request, res: Response) => {
    try {
      const sectionId = parseInt(req.params.sectionId);
      const sector = req.body.sector || 'utilities';
      
      console.log(`🔄 PROCESSING SECTION ${sectionId} with current MSCC5 rules`);
      
      // Get section raw data
      const section = await db.select()
        .from(sectionInspections)
        .where(eq(sectionInspections.id, sectionId))
        .limit(1);
      
      if (section.length === 0) {
        return res.status(404).json({ error: 'Section not found' });
      }
      
      const sectionData = section[0];
      
      // Process with current rules
      const processed = await SectionProcessor.processSection(
        sectionData.rawObservations || [],
        sectionData.secstatGrades,
        sector,
        sectionData.itemNo
      );
      
      // Update processed fields
      await db.update(sectionInspections)
        .set({
          defects: processed.defects,
          defectType: processed.defectType,
          severityGrade: processed.severityGrade.toString(),
          severityGrades: processed.severityGrades,
          recommendations: processed.recommendations,
          adoptable: processed.adoptable
        })
        .where(eq(sectionInspections.id, sectionId));
      
      console.log(`✅ PROCESSED SECTION ${sectionId}: ${processed.defectType} Grade ${processed.severityGrade}`);
      
      res.json({
        success: true,
        processed,
        message: `Section ${sectionData.itemNo} processed with current MSCC5 rules`
      });
      
    } catch (error) {
      console.error('❌ Error processing section:', error);
      res.status(500).json({ error: 'Failed to process section' });
    }
  });
  
  // Bulk reprocess all sections for an upload
  app.post('/api/uploads/:uploadId/reprocess', async (req: Request, res: Response) => {
    try {
      const uploadId = parseInt(req.params.uploadId);
      const sector = req.body.sector || 'utilities';
      
      console.log(`🔄 BULK REPROCESSING upload ${uploadId} with current MSCC5 rules`);
      
      await SectionProcessor.processUploadSections(uploadId, sector);
      
      console.log(`✅ BULK REPROCESSING complete for upload ${uploadId}`);
      
      res.json({
        success: true,
        message: `All sections for upload ${uploadId} reprocessed with current MSCC5 rules`
      });
      
    } catch (error) {
      console.error('❌ Error in bulk reprocessing:', error);
      res.status(500).json({ error: 'Failed to reprocess sections' });
    }
  });
}