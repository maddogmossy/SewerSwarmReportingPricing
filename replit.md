# Replit Architecture Documentation

## Overview
This full-stack TypeScript application provides a compliant document analysis platform for highly regulated sectors (Utilities, Adoption, Highways). It processes various report formats based on WRc MSCC5 + OS20X standards, integrates payments, and ensures regulatory adherence. The system includes an intelligent cost decision persistence feature designed to improve operational efficiency and compliance, with broad market potential across regulated industries.

## User Preferences
- Stability Priority: User prioritizes app stability over advanced features - avoid breaking working functionality
- Screen Flashing Issue: Complex helper functions cause screen flashing - prefer simple implementations
- Performance Focus: Remove complex useCallback functions that recreate on every render
- Validation Preferences: Use visual red triangle warnings in browser interface instead of browser alert popups
- Dashboard Button Policy: Dashboard button should handle save functionality with validation - never add separate save buttons without explicit user request
- Category Card Design: Use colored borders instead of background fills - colors should appear as borders, not full card backgrounds
- UI Design:
  - TP1 (cleanse/survey) and TP2 (repair) popups should have identical styling and layout
  - Use category card icons instead of generic icons (Edit for patching, PaintBucket for lining, Pickaxe for excavation)
  - Make entire UI containers clickable rather than separate buttons
  - CCTV/Jet Vac should be first option with "Primary" badge
- Zero Synthetic Data Policy: NEVER create, suggest, or use mock, placeholder, fallback, or synthetic data.
- Database-First Architecture: System uses pure database-first approach without buffer layers. All UI values reflect authentic database state with immediate persistence.
- Mandatory User Approval Rule: MUST ask/check with user before making any changes.
- Uniform Recommendation System: Use only the triangle warning system for ALL recommendations (service and structural), following WRc MSCC5 + OS20X standards from Drain Repair Book (4th Ed.).
- WRc Classification Standards: All defect types including line deviations (LL/LR) must be properly recognized and classified according to WRc MSCC5 standards for accurate severity grading and recommendations.
- Critical CXB Classification Fix: CXB (Connection defective, connecting pipe is blocked) is definitively classified as SERVICE defect (Grade 4) per MSCC5 standards, NOT structural.
- Unified Processing Standards: All database uploads processed with identical logic using priority-based item numbering and automatic schema detection for consistent results across all report formats.
- F606 MM4-150 Auto-Population Fix: Implement automatic population of purple length range fields in F606 configurations based on detected maximum total lengths from dashboard sections, with 10% safety buffer for proper cost calculation linking.
- Navigation Defaults: System must always default to Utilities sector first. Dashboard entry should preserve report sector context.
- Multi-Sector Price Copying: Sector cards support Ctrl+Click for selecting multiple sectors for price copying functionality across highlighted sectors.
- Single Source Day Rate System: Eliminated dual storage confusion by migrating all day rates from `pricing_options` to MM4 blue values only. System now reads day rates exclusively from `mm_data.mm4Rows[0].blueValue`.
- F606→F690 Configuration Migration: Completed full migration from deleted F606 configurations to F690. All hardcoded references updated (UI components, routing, equipment priority defaults, status codes, and navigation). Added automatic redirect from deleted F606 URLs to F690 configurations.
- A1-F16 Sector Card System: Restructured PR2 configurations with logical sector-based naming (Utilities=A1-A16, Adoption=B1-A16, Highways=C1-C16, Insurance=D1-D16, Construction=E1-E16, Domestic=F1-F16). Each sector gets identical equipment types.
- Unified Database ID System: DevLabels display actual database IDs (756, 757, 790, etc.) instead of hardcoded F-numbers. All 96 category cards (6 sectors × 16 categories) have complete database records with proper A1-F16 naming and unified ID display.
- Multi-Sector Configuration Copying: Implemented MMP1 ID7-12 sector copying system. Users configure rates in one sector (e.g., id7/Utilities), then select additional sector IDs (id8-12) to automatically copy pricing and calculations.
- MM4 Recommendation Linking Fix: Eliminated all hardcoded legacy routing (id=615) from MM4 structural recommendations. System now uses authentic A1-F16 database ID routing (763=A8-Utilities, 772=B8-Adoption, 806=C8-Highways, etc.) for proper sector-specific patching configuration linking. Removed all legacy patching-mm4-225 patterns and replaced with dynamic categoryId=patching routing for complete database-first consistency.
- DevLabel Database-First Restoration: Fixed critical DevLabel display system to show authentic database IDs (759, 760, 763, etc.) instead of category names or A-series labels. Restored database-first architecture where A1-F16 system applies to sectors only, while category cards maintain authentic database ID references essential for existing code dependencies. Updated ID 760 category_name from "CCTV/Jet Vac" to "A5 - CCTV/Jet Vac" for naming consistency.
- MM4 Purple Field Correction: Fixed critical mislabeling of MM4 purple fields from "Debris %"/"Length" to correct "Min Quantity"/"Min Patches" with proper numeric placeholders (3, 4) instead of range placeholders (0-15, 0-35). Purple fields now correctly represent minimum patch quantity requirements for cost calculation logic.
- Dashboard Cost Calculation Fix: Implemented correct MM4-based cost logic using green values (cost per 1mts patch) × defect count with minimum quantity validation. Day rate (£1650) now only applies when defect count falls below purple minimum quantities. Red cost display properly triggers when day rate applied due to minimum thresholds not being met.
- Critical Pipe Size Key Fix: Corrected dashboard MM4 data access using proper pipe size key format (225-2251) instead of malformed keys (225-22551). System now properly accesses MM4 green values and purple minimum quantities for accurate cost calculations.
- Purple Field Repurposing Complete: Successfully repurposed existing purple database fields (purpleDebris/purpleLength) to store minimum patch quantities while maintaining field name compatibility. UI displays correct "Min Quantity"/"Min Patches" labels with test values (3, 4) working properly.
- Database-Direct Persistence Implementation: Eliminated buffer contamination system across all MMP1Template configurations (ID763, etc.). Removed localStorage interference and debounce delays, implementing immediate database persistence following proven ID759/760 pattern. Fixed critical data reappearance issue and ensures single source of truth from database.
- Item 13a Pricing Resolution: Fixed 'D' defect pattern recognition in structural defect matching regex to include 'D' (Deformed sewer/drain) for Item 13a compatibility. Corrected MSCC5 structural codes pattern: /\b(FC|FL|CR|JDL|JDS|DEF|OJL|OJM|JDM|CN|D)\b/ ensures proper routing to ID763 patching configuration.
- MM4 Input Blocking Elimination: Removed triggerAutoSave conflicts from updateMM4Row function that caused input freezing during data entry. Implemented conflict-free database-direct updates allowing users to complete typing without interference.
- F615 Legacy System Complete Removal: Eliminated all remaining F615 structural patching references, replacing with modern MM4-based patching calculations. Updated method names and status codes from 'F615 Structural Patching'/'f615_calculated' to 'MM4 Structural Patching'/'mm4_calculated' for consistency.
- Complete localStorage Contamination Purge: Verified and confirmed elimination of all localStorage.setItem/getItem calls from MMP1Template. System now operates on pure database-first architecture without buffer layer contamination.
- Standardized Observation Display Format: Implemented unified format for all SER and STR observations with bold quoted MSCC5 codes, consistent bullet points, and proper meterage placement. Format: `• <b>"CODE"</b> - Description` for service defects with meterage in description, and `• <b>"CODE"</b> - Description at XXXm` for structural defects with meterage at end. Uses HTML bold tags for proper rendering.
- Conditional SC Code Extraction: SC (pipe size changes) codes are only extracted and displayed when structural defects are present in the same section, following WRc MSCC5 standards where SC codes are only operationally significant when combined with structural issues requiring repair. Service-only and no-defect sections completely ignore SC codes.
- Raw Data Architecture Implementation (Jan 2025): Successfully implemented clean separation between data extraction and processing logic. Raw observations stored in `rawObservations` array field, SECSTAT grades in `secstatGrades` JSON field, processing applied on-demand using current MSCC5 rules. Architecture eliminates mixed concerns and enables immediate application of rule changes to all historical data.
- Complete MSCC5 Validation System: Observation-only sections (line deviations, OBI codes) correctly classified as Grade 0 per WRc MSCC5 standards. System properly distinguishes between observation data and actual defects requiring grading. Migration completed for 27 sections with 92% raw data coverage and accurate Grade 0 classification for Items 9, 12, 18, 24.

## System Architecture

### Frontend
- **Framework**: React with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query
- **UI Components**: shadcn/ui, Radix UI
- **Styling**: Tailwind CSS with CSS variables
- **Build Tool**: Vite
- **UI/UX Decisions**: Standardized patterns for Configuration Dropdown, Category Cards (colored borders), CTF (Configuration Template Framework), Dashboard Table, Unified Pipe Size Switching, Unified Popup Design. Visual Validation System (red triangle warnings) and Enhanced Warning System (cost decision persistence).

### Backend
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js (ES modules)
- **Database ORM**: Drizzle ORM
- **Session Management**: Express session
- **File Handling**: Multer
- **Technical Implementations**: Unified File Processing System for PDF and .db file uploads with standardized processing, item number assignment, SECSTAT extraction, and WRc MSCC5 classification. Advanced Cost Calculation System integrates database ID processing, patch counting, and MM4 integration.

### Database
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM (schema-first approach)
- **Schema Location**: `shared/schema.ts`
- **Schema**: Manages Users, Sessions, File Uploads, Subscription Plans, and Report Pricing.

### Deployment Strategy
- **Development Environment**: Replit with Node.js 20, PostgreSQL 16, hot reloading.
- **Production Build**: Vite for frontend, ESBuild for backend, Drizzle for migrations, deployed on Replit's autoscale.
- **Environment Configuration**: Uses `DATABASE_URL`, `STRIPE_SECRET_KEY`, `SESSION_SECRET`, `REPLIT_DOMAINS`, `VITE_STRIPE_PUBLIC_KEY`.

## External Dependencies

- **Database**: Neon PostgreSQL
- **Authentication**: Replit Auth
- **Payments**: Stripe API
- **UI Components**: Radix UI, shadcn/ui
- **File Upload**: Multer