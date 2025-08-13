# Replit Architecture Documentation

## Overview
This is a full-stack TypeScript application, built with React and Express, providing document analysis services for sector-specific compliance checking in Utilities, Adoption, and Highways. Its core purpose is to streamline document analysis and compliance processes, offering a robust solution with high market potential in regulated industries by integrating file upload, Stripe payments, and Replit authentication. The system aims for uniform processing of various report formats (GR7188, GR7188a, GR7216) with consistent results, applying WRc MSCC5 + OS20X standards, and featuring an intelligent cost decision persistence system.

## User Preferences
- **Stability Priority**: User prioritizes app stability over advanced features - avoid breaking working functionality
- **Screen Flashing Issue**: Complex helper functions cause screen flashing - prefer simple implementations
- **Performance Focus**: Remove complex useCallback functions that recreate on every render
- **Validation Preferences**: Use visual red triangle warnings in browser interface instead of browser alert popups
- **Dashboard Button Policy**: Dashboard button should handle save functionality with validation - never add separate save buttons without explicit user request
- **Category Card Design**: Use colored borders instead of background fills - colors should appear as borders, not full card backgrounds
- **UI Design**:
  - TP1 (cleanse/survey) and TP2 (repair) popups should have identical styling and layout
  - Use category card icons instead of generic icons (Edit for patching, PaintBucket for lining, Pickaxe for excavation)
  - Make entire UI containers clickable rather than separate buttons
  - CCTV/Jet Vac should be first option with "Primary" badge
- **Zero Synthetic Data Policy**: NEVER create, suggest, or use mock, placeholder, fallback, or synthetic data.
- **Mandatory User Approval Rule**: MUST ask/check with user before making any changes.
- **Uniform Recommendation System**: Use only the triangle warning system for ALL recommendations (service and structural), following WRc MSCC5 + OS20X standards from Drain Repair Book (4th Ed.).
- **WRc Classification Standards**: All defect types including line deviations (LL/LR) must be properly recognized and classified according to WRc MSCC5 standards for accurate severity grading and recommendations.
- **Critical CXB Classification Fix**: CXB (Connection defective, connecting pipe is blocked) is definitively classified as SERVICE defect (Grade 4) per MSCC5 standards, NOT structural. Hardcoded overrides that classify CXB as structural have been removed.
- **Unified Processing Standards**: All database uploads processed with identical logic using priority-based item numbering (SEC_ItemNo → OBJ_SortOrder → pattern extraction → fallback) and automatic schema detection for consistent results across all report formats.
- **F606 MM4-150 Auto-Population Fix**: Implemented automatic population of purple length range fields in F606 configurations based on detected maximum total lengths from dashboard sections, with 10% safety buffer for proper cost calculation linking.
- **Navigation Defaults**: System must always default to Utilities sector first. Dashboard entry should preserve report sector context.
- **Multi-Sector Price Copying**: Sector cards support Ctrl+Click for selecting multiple sectors for price copying functionality across highlighted sectors.
- **Single Source Day Rate System**: Eliminated dual storage confusion by migrating all day rates from `pricing_options` to MM4 blue values only. System now reads day rates exclusively from `mm_data.mm4Rows[0].blueValue` preventing synchronization issues and ensuring UI-driven pricing consistency.
- **F606→F690 Configuration Migration**: Completed full migration from deleted F606 configurations to F690. All hardcoded references updated (UI components, routing, equipment priority defaults, status codes, and navigation). Added automatic redirect from deleted F606 URLs to F690 configurations to prevent broken navigation.
- **A1-F16 Sector Card System**: Completely restructured PR2 configurations with logical sector-based naming. Utilities=A1-A16, Adoption=B1-B16, Highways=C1-C16, Insurance=D1-D16, Construction=E1-E16, Domestic=F1-F16. Each sector gets identical equipment types (A1=CCTV, A2=Van Pack, etc.) eliminating random F-numbers and P-series confusion. Perfect frontend-database matching with clear user identification.
- **Unified Database ID System**: Eliminated confusion between 3 different numbering systems (F-series, P-series, database IDs). DevLabels now display actual database IDs (756, 757, 790, etc.) instead of hardcoded F-numbers. All 96 category cards (6 sectors × 16 categories) now have complete database records with proper A1-F16 naming and unified ID display.
- **Multi-Sector Configuration Copying**: Implemented P003 MMP1 ID7-12 sector copying system. Users configure rates in one sector (e.g., id7/Utilities), then select additional sector IDs (id8-12) to automatically copy pricing and calculations to other sectors. Once copied, each sector becomes independent - changes only affect the current sector. System maps id7→utilities, id8→adoption, id9→highways, id10→insurance, id11→construction, id12→domestic with comprehensive pipe size support (100-1500mm) and complete MM4/MM5 data preservation.
- **Database ID Migration Fix**: Resolved critical issue where P003 MMP1 configuration updates created duplicate configurations (id907-920) without proper A1-F16 naming. Cleaned up 14 duplicate records and restored proper routing to id760 (A5 - CCTV/Jet Vac) which maintains correct A1-F16 system integrity. Removed pipe size locks to enable dynamic sizing across all configurations.
- **Complete Database Cleanup**: Identified and removed additional 28 duplicate configurations (IDs 856-906) that lacked A1-F16 naming system compliance. Database now contains 1,397 properly named configurations with 100% A1-F16 system coverage across all sectors (A1-A16=Utilities, B1-B16=Adoption, C1-C16=Highways, D1-D16=Insurance, E1-E16=Construction, F1-F16=Domestic).
- **Critical Service Cost Validation Fix**: Resolved fatal issue where calculateAutoCost returned null values causing service cost validation to fail. All null returns replaced with proper cost objects containing status codes. Service items now properly enter cost calculation pipeline with structured validation instead of string checking. This prevents validation errors and enables proper warning dialog functionality.
- **Dual System Architecture Fix**: Clarified and preserved separate systems - A1-F16 for main configurations (utilities=A1-A16, etc.) and id7-id12 for MMP1 cross-sector copying (id7=utilities, id8=adoption, etc.). Fixed data structure mismatches between frontend (mmData) and backend (mm_data) formats. Enhanced MM4 validation to support both structures, ensuring proper cost calculations.
- **Blue Triangle Issue Resolution (Jan 2025)**: Fixed critical issue where dashboard showed blue triangles instead of calculated costs. Root cause was ID pattern mismatch - ID759 stored prices under old "150-1051" pattern while frontend searched for new "150-1501" pattern. Updated database to use consistent patterns, enhanced status logic to return proper 'id759_calculated'/'id760_calculated' statuses instead of 'day_rate_missing', and implemented localStorage cache clearing to remove conflicting pattern references. Both ID760 (£1850/30 runs) and ID759 (£950/20 runs) now display proper red costs when below minimum requirements instead of blue triangles.
- **Report Reprocessing System Investigation (Jan 2025)**: Completed comprehensive analysis and systematic fixes for data processing pipeline. System has enhanced reprocessing capability through dedicated `/api/reprocess/:uploadId` endpoint that reads fresh from .db3 files. Fixed critical pipe size accuracy issue affecting sections 1-19 (corrected from 100mm to authentic 150mm/225mm values). Removed legacy reprocessing system (`routes-rev-v1.ts`) to eliminate confusion. Added "Reprocess from DB3" button to dashboard for manual verification workflow. Created systematic validation process with automatic pipe size correction at storage level. All processing now uses unified logic with comprehensive error handling and status tracking.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for development and bundling

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js (ES modules)
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Session Management**: Express session with PostgreSQL store
- **File Handling**: Multer for file uploads (PDF and .db files)
- **Payment Processing**: Stripe integration

### Database Architecture
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM with schema-first approach
- **Schema Location**: `shared/schema.ts` for type sharing between frontend and backend

### Key Components
- **Authentication System**: Replit Auth (OpenID Connect) for user management and access control.
- **Unified File Processing System**: Handles PDF and .db file uploads with standardized processing logic that automatically adapts to different database schemas. Uses unified item number assignment, consistent SECSTAT extraction, and uniform WRc MSCC5 classification across all database formats without format-specific detection.
- **Payment System**: Stripe integration for subscription and pay-per-report pricing, including a trial system.
- **Database Schema**: Manages Users, Sessions, File Uploads, Subscription Plans, and Report Pricing.
- **UI Component Architecture**: Standardized UI patterns including:
    - **Configuration Dropdown**: Dynamic titles for configuration options.
    - **Category Cards**: Clean category selection without configuration details, using colored borders.
    - **CTF (Configuration Template Framework)**: A pattern-based system for scalable and consistent UI/UX across different configuration types.
    - **Dashboard Table Structure**: Professional layout with systematic debugging IDs, optimized column sizing, and dual ID display.
    - **Unified Pipe Size Switching**: Single-page interface for dynamic switching between pipe size configurations, including 525mm support.
    - **Unified Popup Design**: Identical visual design for cleanse/survey (TP1) and repair (TP2) popups with consistent icons and clickable containers.
    - **Visual Validation System**: In-app red triangle warnings replace browser alerts for input validation.
    - **Enhanced Warning System**: Intelligent triggering for service and structural warnings with visual pricing feedback and combined work display. Features cost decision persistence to prevent redundant dialogs.
    - **Cost Calculation System**: Advanced system combining F619+F615 processing, enhanced patch counting, and MM4 integration for robotic cutting.

### Deployment Strategy
- **Development Environment**: Replit with Node.js 20, PostgreSQL 16, and hot reloading.
- **Production Build**: Vite for frontend, ESBuild for backend, Drizzle for migrations, deployed on Replit's autoscale.
- **Environment Configuration**: Uses `DATABASE_URL`, `STRIPE_SECRET_KEY`, `SESSION_SECRET`, `REPLIT_DOMAINS`, `VITE_STRIPE_PUBLIC_KEY`.

## External Dependencies

- **Database**: Neon PostgreSQL (serverless)
- **Authentication**: Replit Auth system
- **Payments**: Stripe API
- **UI Components**: Radix UI primitives, shadcn/ui
- **File Upload**: Multer middleware
- **Development Tools**: TypeScript, ESBuild, Vite, Drizzle Kit