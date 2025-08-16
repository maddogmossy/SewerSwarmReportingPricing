# Replit Architecture Documentation

## Overview
This full-stack TypeScript application provides a platform for compliant document analysis in highly regulated sectors (Utilities, Adoption, Highways). It processes various report formats based on WRc MSCC5 + OS20X standards, integrates payments, and ensures regulatory adherence. The system includes an intelligent cost decision persistence feature designed to improve operational efficiency and compliance. The project aims for broad market potential across regulated industries.

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
- A1-F16 Sector Card System: Restructured PR2 configurations with logical sector-based naming (Utilities=A1-A16, Adoption=B1-B16, Highways=C1-C16, Insurance=D1-D16, Construction=E1-E16, Domestic=F1-F16). Each sector gets identical equipment types.
- Unified Database ID System: DevLabels display actual database IDs (756, 757, 790, etc.) instead of hardcoded F-numbers. All 96 category cards (6 sectors × 16 categories) have complete database records with proper A1-F16 naming and unified ID display.
- Multi-Sector Configuration Copying: Implemented MMP1 ID7-12 sector copying system. Users configure rates in one sector (e.g., id7/Utilities), then select additional sector IDs (id8-12) to automatically copy pricing and calculations.
- Critical Service Cost Validation Fix: Resolved fatal issue where calculateAutoCost returned null values causing service cost validation to fail. All null returns replaced with proper cost objects containing status codes.
- Dual System Architecture Fix: Clarified and preserved separate systems - A1-F16 for main configurations (utilities=A1-16, etc.) and id7-id12 for MMP1 cross-sector copying (id7=utilities, id8=adoption, etc.). Fixed data structure mismatches between frontend (mmData) and backend (mm_data) formats.
- Blue Triangle Issue Resolution: Fixed critical issue where dashboard showed blue triangles instead of calculated costs. Root cause was ID pattern mismatch.
- Report Reprocessing System Investigation: Enhanced reprocessing capability through dedicated `/api/reprocess/:uploadId` endpoint that reads fresh from .db3 files. Added "Reprocess from DB3" button to dashboard for manual verification workflow.
- Upstream/Downstream Manhole Reference Rule Restoration: Restored critical flow direction logic using manhole numbering sequence to determine inspection direction (fromMH vs toMH).
- Line Deviation Classification Fix: Corrected critical misclassification where line deviations (LL/LR codes) were being processed as service Grade 1 defects instead of Grade 0 observations.
- Critical Defect Classification Override Bug Fix: Fixed major bug where line deviation logic was incorrectly overriding all other defects, causing sections with deposits and line deviations to be classified as Grade 0.
- Upstream/Downstream Manhole Reference Fix: Implemented authentic inspection direction system using SECINSP.INS_InspectionDir field from WinCan database.
- Item 9 Line Deviation Classification Investigation: Confirmed Item 9 contains authentic observations in SECOBS table (MH|0, WL|0, LL|1.87, MHF|2.59). The real issue identified: line deviations (LL/LR codes) are being incorrectly classified as Grade 1 service defects instead of Grade 0 observations per WRc MSCC5 standards.
- Bend Logic Investigation: Current system treats REST/BEND as simple observation codes (Grade 0) without conditional logic. MISSING FEATURE: No conditional logic found that says "bends can be ignored unless there are structural recommendations for lining and patches".
- Defect Text Standardization: Standardized Grade 0 defect text across processing pipeline from "No defects recorded" to "No service or structural defect found" for consistency. Updated wincan-db-reader.ts lines 1010, 1337, and 1472 to use uniform wording that matches MSCC5 classifier expectations. This ensures consistent presentation of sections without observable defects per WRc MSCC5 standards.
- Cost Confirmation Popups Re-enabled: Restored cost confirmation warning dialogs by setting DISABLE_ALL_WARNINGS = false. Service and structural cost warnings now display when cost calculations are completed, allowing users to confirm automatic pricing decisions.
- Sequential Configuration Warning System: Implemented comprehensive configuration validation for synthetic dashboards (items 1-24). System detects unconfigured items, displays sequential warning popups with navigation to relevant configurations, and supports equipment switching between id759 (A5) and id760 (A4) across all pipe sizes. Includes "Got It" navigation flow and "Skip All" option for user control.
- Critical Data Integrity Fix: PIN code "Quality" authorized. Eliminated systematic data deletion bug where system forced empty purple fields for "non-authentic" pipe sizes (lines 1086-1094 pr2-config-clean.tsx). Fixed false range validation warnings by improving logic to check both purpleLength AND purpleDebris fields. Restored corrupted ID759 data via SQL UPDATE. All pipe sizes now preserve authentic user data preventing database corruption.
- A5 Plugin Error Resolution: Fixed equipment priority state management in cleaning-options-popover.tsx with proper error handling. Added try-catch blocks to prevent state conflicts during A5/A4 priority switching. Resolved "plugin error" which was actually equipment priority validation failure.
- A4 Red Price Display Fix: Enhanced cost calculation validation to properly detect incomplete configurations. Added mm4_incomplete_config status for sections with missing debris % or length ranges. Fixed meetsMinimumQuantities logic to show red triangles for A4 configurations with empty purpleDebris fields.
- Complete Orange Logic Removal: Eliminated all legacy orange minimum validation that was incorrectly overriding A4 configuration validation. Replaced checkOrangeMinimumMet() function with checkConfigurationComplete() that properly validates blue, green, and purple field completeness. Fixed database inconsistency where blueValue contained "9" instead of empty string. A4 CCTV van pack configurations now correctly display red prices when any required field (blue day rate, green runs, purple debris %, purple length) is incomplete.
- Complete TP1 Legacy Code Removal: Eliminated all TP1 legacy status codes ('tp1_unconfigured', 'tp1_invalid', 'tp1_missing') from validation system that were causing red triangle contamination in MM4 system. Modernized all status codes to use MM4-based validation ('configuration_missing', 'mm4_validation_failed', 'mm4_incomplete_config'). Removed TP1 legacy references from isValidCostCalculation logic to prevent validation conflicts between old TP1 and new MM4 systems.
- DEFORMATION Classification Fix: Corrected critical misclassification where DEFORMATION defects (DEF code) were incorrectly classified as service type instead of structural. Updated MSCC5_DEFECTS.DEF definition from `type: 'service'` to `type: 'structural'` per WRc MSCC5 standards. Applied fix to database for items 19, 20 which now correctly show as structural defects requiring patching instead of service cleaning.
- A5/A4 Equipment Switching Bug Fix: Resolved critical issue where switching from A4→A5 caused blue triangles requiring report reprocessing. Implemented equipment-specific buffer namespace isolation, configuration reload sequencing, and extended timing for proper state synchronization. Added buffer key management to prevent cross-equipment contamination between id759/760 configurations. Fixed configuration selection logic to always respect user's explicit equipment priority choice instead of overriding based on data availability. System now maintains consistent cost calculations regardless of switch direction.
- ID759/760 Default Logic Standardization: Fixed contradictory default priority logic where comments claimed ID760 was default but code defaulted to ID759. Standardized system to use ID760 (A5-CCTV/Jet Vac) as default matching equipment selection UI. Removed all legacy 606/608 references replacing with actual database IDs 759/760. Updated buffer key resolution to use authentic MM4-150 blue/green values (ID759: £850/30 runs, ID760: £1850/20 runs). Eliminated circular fallback logic and improved equipment priority state management with proper UI alignment.
- Complete Legacy Code Elimination: Executed comprehensive cleanup removing all F-series references (F606, F608, F610-F624) from fallback data, routing logic, pricing displays, and configuration components. Replaced hardcoded F-series DevLabels with dynamic database ID references. Eliminated P-series mapping patterns (P011-P524) while preserving intentional id7-12 dual architecture for MMP1 cross-sector functionality. Removed legacy id1-6 sector mappings. Replaced all P-series and F-series patterns with clean A1-F16 system across client components (pr2-config-clean.tsx, pr2-pricing.tsx) and server routes (routes-pr2-clean.ts). System now operates entirely on authentic database IDs with future-proof dynamic configuration management and standardized A1-F16 page identification.
- Critical DEF Pattern Matching Fix: Fixed major defect classification bug where DEF (deformity) defects were being misclassified as 'service' instead of 'structural' type. Root cause was missing pattern matching for 'deformity', 'deformed', 'deform' keywords in wrc-standards-engine.ts matchesDefectPattern function. Added DEF patterns to properly detect and classify structural deformation defects per WRc MSCC5 standards. Updated database records for affected items (e.g., item 20) from incorrect 'service' classification to correct 'structural' classification. This ensures accurate severity grading and proper structural repair recommendations for deformation defects.
- MM4-225 Configuration Fix: Corrected critical data inconsistency in ID759 (CCTV Van Pack) where 225mm pipe configuration had incorrect green value of "2" runs instead of standard "20" runs per shift. Fixed database record and cleared buffer system to ensure proper cost calculations for 225mm sections. Now matches standardized equipment configuration pattern across all pipe sizes (150mm: 30 runs, 225mm: 20 runs, 300mm: 30 runs). This eliminates blue triangle calculation errors and ensures consistent MM4 buffer value management.
- Unified MM4 Data Flow Architecture: Implemented comprehensive data synchronization system to resolve persistent value conflicts between database, buffer, localStorage, and UI inputs. Established user input priority hierarchy where buffer values always take precedence over backend data to prevent user input overwrites. Added missing ID760 225mm configuration and standardized all blue/green values (ID759: £950/20-30 runs, ID760: £1850/20 runs). Enhanced buffer management with conflict detection, stale entry cleanup, and data integrity validation. Fixed asynchronous race conditions in auto-save system with user input preservation guarantees. System now maintains consistent MM4 values across all pipe sizes with authenticated user data priority.
- Critical Deformity Classification Fix: Resolved major bug where single deformity defects (items 19, 20) were misclassified as service instead of structural. Root cause: multi-defect sections correctly used splitting logic with proper DEF code recognition, but single deformity sections bypassed this logic and used flawed classification path. Implemented fixes in parseAllDefectsFromText() to detect descriptive deformity text without explicit DEF codes, enhanced extractSeverityGrades.ts to recognize DEFORMITY/DEFORMED keywords, and strengthened wincan-db-reader.ts structural enforcement. Database corrected: items 19, 20 now properly classified as structural with appropriate WRc recommendations per MSCC5 standards.

## System Architecture

### Frontend
- **Framework**: React with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query
- **UI Components**: shadcn/ui, Radix UI
- **Styling**: Tailwind CSS with CSS variables
- **Build Tool**: Vite
- **UI/UX Decisions**: Standardized patterns for Configuration Dropdown, Category Cards (colored borders), CTF (Configuration Template Framework), Dashboard Table, Unified Pipe Size Switching, Unified Popup Design. Core UI features include a Visual Validation System (red triangle warnings) and an Enhanced Warning System (cost decision persistence).

### Backend
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js (ES modules)
- **Database ORM**: Drizzle ORM
- **Session Management**: Express session
- **File Handling**: Multer
- **Technical Implementations**: Unified File Processing System handles PDF and .db file uploads with standardized processing, item number assignment, SECSTAT extraction, and uniform WRc MSCC5 classification. Advanced Cost Calculation System integrates database ID processing, patch counting, and MM4 integration.

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