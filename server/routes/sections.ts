/**
 * Sections API - Clean processing endpoints
 */

import { Request, Response, Express } from 'express';
import { db } from '../db';
import { sectionInspections } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { SectionProcessor } from '../section-processor';
import { RawDataMigrator } from '../raw-data-migrator';

export function registerSectionRoutes(app: Express) {
  
  // Complete migration endpoint - Item 1
  app.post("/api/uploads/:uploadId/migrate", async (req: Request, res: Response) => {
    try {
      const uploadId = parseInt(req.params.uploadId);
      const { sector = 'utilities' } = req.body;
      
      console.log(`🔄 Starting complete migration for upload ${uploadId}`);
      
      await RawDataMigrator.migrateUpload(uploadId, sector);
      
      res.json({ 
        success: true, 
        message: `Complete migration finished for upload ${uploadId}` 
      });
    } catch (error) {
      console.error("Error in complete migration:", error);
      res.status(500).json({ error: "Migration failed" });
    }
  });
  
  // Reprocess endpoint - Item 2
  app.post("/api/uploads/:uploadId/reprocess", async (req: Request, res: Response) => {
    try {
      const uploadId = parseInt(req.params.uploadId);
      const { sector = 'utilities' } = req.body;
      
      console.log(`🔄 Reprocessing upload ${uploadId} with current MSCC5 rules`);
      
      await SectionProcessor.processUploadSections(uploadId, sector);
      
      res.json({ 
        success: true, 
        message: `Reprocessing completed for upload ${uploadId}` 
      });
    } catch (error) {
      console.error("Error in reprocessing:", error);
      res.status(500).json({ error: "Reprocessing failed" });
    }
  });
  
  // Get sections with uniform on-demand processing
  app.get('/api/uploads/:uploadId/sections', async (req: Request, res: Response) => {
    try {
      const uploadId = parseInt(req.params.uploadId);
      const sector = req.query.sector as string || 'utilities';
      
      console.log(`🔍 SECTIONS API - Fetching sections for upload ${uploadId}`);
      
      // Get raw sections from database
      const sections = await db.select()
        .from(sectionInspections)
        .where(eq(sectionInspections.fileUploadId, uploadId));
      
      console.log(`🔍 SECTIONS API - Found ${sections.length} sections total`);
      
      // DEBUG: Check raw data availability
      const sectionsWithRawData = sections.filter(s => s.rawObservations && s.rawObservations.length > 0);
      console.log(`🔍 SECTIONS DEBUG - Raw data available for ${sectionsWithRawData.length}/${sections.length} sections`);
      
      // Check if we need to migrate to raw data format
      const needsMigration = sections.some(section => !section.rawObservations || section.rawObservations.length === 0);
      
      if (needsMigration) {
        console.log(`🔄 SECTIONS API - Migrating to raw data format`);
        await RawDataMigrator.migrateUpload(uploadId);
        
        // Refetch after migration
        const migratedSections = await db.select()
          .from(sectionInspections)
          .where(eq(sectionInspections.fileUploadId, uploadId));
        
        // Process on-demand and return processed results
        const processedSections = await Promise.all(
          migratedSections.map(async (section) => {
            if (section.rawObservations && section.rawObservations.length > 0) {
              const processed = await SectionProcessor.processSection(
                section.rawObservations,
                section.secstatGrades,
                sector,
                section.itemNo
              );
              return { ...section, ...processed };
            }
            return section;
          })
        );
        
        return res.json(processedSections);
      }
      
      // UNIFORM ARCHITECTURE: Process raw data on-demand for dashboard
      console.log(`🔄 SECTIONS API - Processing raw data on-demand for ${sections.length} sections`);
      
      const processedSections = await Promise.all(
        sections.map(async (section) => {
          console.log(`🔍 Processing section ${section.itemNo}: hasRawData=${!!(section.rawObservations && section.rawObservations.length > 0)}`);
          
          if (section.rawObservations && section.rawObservations.length > 0) {
            const processed = await SectionProcessor.processSection(
              section.rawObservations,
              section.secstatGrades,
              sector,
              section.itemNo
            );
            console.log(`✅ Processed item ${section.itemNo}: ${processed.defectType} Grade ${processed.severityGrade}`);
            return { ...section, ...processed };
          } else {
            console.log(`⚠️ Section ${section.itemNo}: No raw data available, returning stored data`);
            return section;
          }
        })
      );
      
      console.log(`🔍 SECTIONS API - Returning ${processedSections.length} processed sections`);
      res.json(processedSections);
      
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
      
      // Update processed fields (optional caching)
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