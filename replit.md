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