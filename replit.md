# Replit Architecture Documentation

## Rev v8.3 - Database Session Persistence and 525mm Support (August 2025)
**Lock-in Checkpoint**: Fixed database switching persistence issue and added comprehensive 525mm pipe size support for both GR7188 and GR7216 processing.

### Key Achievements in v8.3:
- **Database Session Persistence**: Fixed critical issue where navigating from dashboard to F606 configuration and back would revert from GR7188 to GR7216
- **ReportId Parameter Preservation**: F606 configuration page now preserves reportId when navigating back to dashboard
- **WRC Recommendation Navigation**: Updated WRC recommendation links to preserve reportId when routing to configuration pages
- **525mm Pipe Size Support**: Added complete 525mm configuration to F606 MM4 database for authentic GR7188 processing
- **Enhanced 525mm Debugging**: Added comprehensive debugging for 525mm pipe size sections to trace cost calculation flow
- **Verified Configuration Routing**: GR7216 now correctly directs to F606 MM4-525 configuration (awaiting user pricing input)

## Rev v8.2 - Complete SECSTAT Severity Grade Unification (August 2025)
**Lock-in Checkpoint**: Achieved 100% identical severity grade processing between GR7188 and GR7216 through automatic database format detection and unified SECSTAT extraction logic.

### Key Achievements in v8.2:
- **Automatic Database Format Detection**: System automatically detects GR7188 (SEC_ItemNo) vs GR7216 (OBJ_Key) formats
- **Unified SECSTAT Processing**: Both databases use identical STA_Inspection_FK linking with proper item number mapping
- **Authentic Severity Grades**: GR7216 now correctly extracts SECSTAT grades (Item 1: service grade 1, Item 2: service grade 1 with no-defect override to grade 0)
- **Identical Processing Logic**: Both formats follow same observation reading, defect classification, and recommendation generation
- **Enhanced Column Mapping**: Transparent mapping between SEC_* (GR7188) and OBJ_* (GR7216) column structures
- **Sequential Item Numbering**: GR7216 S1.015X→Item 1, S1.016X→Item 2 mapping now works correctly
- **Raw Material Preservation**: Shows authentic "CO" values without incorrect conversion to descriptive names

## Rev v8.0 - Enhanced Warning System with Visual Feedback (August 2025)
**Lock-in Checkpoint**: Advanced warning system with intelligent triggering, combined work display, and visual pricing feedback for structural applications.

### Key Achievements in v8.0:
- **Enhanced Structural Warning System**: Always triggers regardless of day rate status with intelligent default selection ("Keep Current Prices" when costs exceed day rate)
- **Combined Work Display**: Item 19 now properly shows "1 cut & 2 patches" for F619 robotic cutting + F615 structural patching work
- **Green Pricing Feedback**: Applied structural pricing now displays with green highlighting and background borders in dashboard
- **Intelligent Dialog Messaging**: Context-aware dialog text showing "Excess over minimum" vs "Shortfall to minimum" based on cost scenarios
- **Sequential Workflow Enhancement**: Seamless service warning → structural warning → export workflow with proper state management
- **Visual State Management**: Applied pricing tracking separate from cost adjustments for clear user feedback

## Rev v6.3 - Enhanced Cost Calculation System (August 2025)
**Lock-in Checkpoint**: Advanced cost calculation system with combined F619+F615 processing, enhanced patch counting for multiple defect locations, and MM4 integration for robotic cutting.

### Key Achievements in v6.3:
- **F619 MM4 Integration**: Robotic cutting now uses MM4 data (purpleDebris=£450 first cut, purpleLength=£150 per cut) instead of legacy pricingOptions
- **Enhanced F615 Patch Counting**: Advanced pattern matching for multiple defect locations (e.g., "D Deformation at 26.47m, 58.97m" = 2 patches)
- **Combined F619+F615 Processing**: Sections with both junction and structural defects now calculate combined costs properly
- **P4/ID4 Legacy Support**: Updated robotic cutting detection to include "P4" references from old recommendation windows
- **Authentic MM4 Pricing**: F615 patching uses authentic 150mm (£450/patch) and 300mm (£550/patch) pricing from MM4 configurations
- **Advanced Debugging System**: Comprehensive console logging for cost calculation tracing and validation

## Overview
This is a full-stack TypeScript application, built with React and Express, providing document analysis services for sector-specific compliance checking in Utilities, Adoption, and Highways. Its core purpose is to streamline document analysis and compliance processes, offering a robust solution with high market potential in regulated industries by integrating file upload, Stripe payments, and Replit authentication.

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
- **File Processing System**: Handles PDF and .db file uploads, including local storage, status tracking, and authentic data extraction from Wincan database files with MSCC5 classification.
- **Payment System**: Stripe integration for subscription and pay-per-report pricing, including a trial system.
- **Database Schema**: Manages Users, Sessions, File Uploads, Subscription Plans, and Report Pricing.
- **UI Component Architecture**: Standardized UI patterns including:
    - **Configuration Dropdown**: Dynamic titles for configuration options.
    - **Category Cards**: Clean category selection without configuration details.
    - **CTF (Configuration Template Framework)**: A pattern-based system for scalable and consistent UI/UX across different configuration types.
    - **Dashboard Table Structure**: Professional layout with systematic debugging IDs, optimized column sizing, and dual ID display.
    - **Unified Pipe Size Switching**: Single-page interface for dynamic switching between pipe size configurations.
    - **Unified Popup Design**: Identical visual design for cleanse/survey (TP1) and repair (TP2) popups with consistent icons and clickable containers.
    - **Visual Validation System**: In-app red triangle warnings replace browser alerts for input validation.

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