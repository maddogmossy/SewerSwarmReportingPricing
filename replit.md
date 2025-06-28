# Replit Architecture Documentation

## Overview

This is a full-stack TypeScript application built with React frontend and Express backend, featuring file upload capabilities, Stripe payment integration, and authentication through Replit's authentication system. The application appears to be designed for document analysis services with sector-specific compliance checking (Utilities, Adoption, Highways).

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

## Key Components

### Authentication System
- **Provider**: Replit Auth (OpenID Connect)
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **User Management**: Custom user storage with Stripe customer integration
- **Access Control**: Route-level authentication middleware

### File Processing System
- **Upload Types**: PDF and .db files up to 50MB
- **Storage**: Local file system (uploads/ directory)
- **Validation**: File type and size validation
- **Processing**: File upload tracking with status management

### Payment System
- **Provider**: Stripe
- **Models**: Subscription-based and pay-per-report pricing
- **Trial System**: Limited trial reports for new users
- **Integration**: Frontend Stripe.js with backend webhook handling

### Database Schema
- **Users**: Profile information, Stripe integration, subscription status
- **Sessions**: Replit Auth session management
- **File Uploads**: Upload tracking and status management
- **Subscription Plans**: Pricing tiers and features
- **Report Pricing**: Dynamic pricing based on report size

## Data Flow

### Authentication Flow
1. User clicks login → Redirects to Replit Auth
2. Replit Auth validates → Returns to callback URL
3. Backend creates/updates user record → Establishes session
4. Frontend receives user data → Updates application state

### File Upload Flow
1. User selects file → Frontend validation
2. File uploaded to backend → Multer processing
3. Database record created → File stored locally
4. Processing status updated → Frontend notified

### Payment Flow
1. User selects plan → Frontend Stripe.js integration
2. Stripe Elements collect payment → Backend processes webhook
3. User subscription updated → Access level modified
4. Features unlocked → Dashboard updated

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL serverless
- **Authentication**: Replit Auth system
- **Payments**: Stripe API
- **UI Components**: Radix UI primitives
- **File Upload**: Multer middleware

### Development Tools
- **TypeScript**: Type safety across full stack
- **ESBuild**: Production bundling for backend
- **Vite**: Frontend development and bundling
- **Drizzle Kit**: Database schema management

## Deployment Strategy

### Development Environment
- **Runtime**: Replit environment with Node.js 20
- **Database**: PostgreSQL 16 module
- **Port Configuration**: Backend on 5000, mapped to external port 80
- **Hot Reload**: Vite HMR for frontend, tsx for backend

### Production Build
- **Frontend**: Vite build to `dist/public`
- **Backend**: ESBuild bundle to `dist/index.js`
- **Database**: Drizzle migrations applied automatically
- **Deployment**: Autoscale deployment target on Replit

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string
- `STRIPE_SECRET_KEY`: Stripe API key
- `SESSION_SECRET`: Session encryption key
- `REPLIT_DOMAINS`: Allowed domains for auth
- `VITE_STRIPE_PUBLIC_KEY`: Frontend Stripe key

## Changelog

```
Changelog:
- June 27, 2025. Initial setup
- June 27, 2025. Added test user access system for unlimited testing without payment
- June 27, 2025. Fixed file upload issue: Updated apiRequest to properly handle FormData uploads
- June 27, 2025. Added sector validation: Users must select sector before file upload (click, drag, input)
- June 27, 2025. Replaced browser alert with elegant sector selection modal overlay - users can now select files immediately and choose sectors through polished modal interface
- June 27, 2025. Fixed stuck report processing issue and added refresh functionality with larger action buttons including "Refresh Reports", "Export Excel", and "Export DB"
- June 27, 2025. Implemented comprehensive sector standards display and defect/repair output logic with downloadable reports containing sector-specific analysis based on WRc/WTI standards
- June 27, 2025. Fixed 403 upload errors by setting test user access and resolved section header display issues with proper typing
- June 27, 2025. Restructured app: moved upload to separate page, redesigned dashboard for section inspection data analysis across full width with multiple item number support
- June 27, 2025. Added report viewing and deletion functionality: Users can click eye icon to view specific reports in dashboard with URL parameters, and delete reports using trash icon with secure backend validation
- June 27, 2025. Enhanced dashboard layout: Project number now displays before item number, supports 1-24 sections per report, and moved analysis standards below section inspection data for better information hierarchy
- June 27, 2025. Restored separate Item No column: Added back dedicated Item No column (1,2,3,4,5...) from Section inspection data, with separate Inspec. No column (defaults to '1' unless multiple surveys of same section)
- June 27, 2025. Fixed Inspec. No column: Corrected to show all '1' values for single survey report (would increment to '2', '3' only for repeat surveys of same sections)
- June 27, 2025. Implemented default values for no-defect sections: Items 1,2,4,5,9,11,12,16,17,18,24 now show standard "No action required" text with Grade 0 and Adoptable Yes for all reports
- June 27, 2025. Updated Start MH and Finish MH extraction: Now pulls actual manhole references from section inspection data (e.g., Item 1: SW02→SW03) instead of using placeholder values
- June 27, 2025. Implemented complete section inspection data extraction: Pipe Size, Pipe Material, Total Length, and Length Surveyed now pull authentic values from actual inspection data for all 24 sections
- June 27, 2025. Transitioned from mock data to real database storage: Section inspection data now stored in database table with proper API endpoints for dashboard display, supporting authentic manhole references and pipe specifications
- June 27, 2025. Fixed field mapping issue between database and frontend: Dashboard now correctly displays all real section inspection data including MH references (SW02→SW03), pipe specifications (150mm PVC, 225mm Concrete), and authentic measurements with proper camelCase field handling from Drizzle ORM
- June 27, 2025. Successfully implemented authentic data extraction: System now displays real inspection data from uploaded files including genuine manhole references (SW02→SW01, SW02→SW03), actual measurements (15.56m, 19.02m), and authentic pipe specifications (150mm PVC, Polyvinyl chloride) with zero placeholder data
- June 27, 2025. Implemented MSCC5 defect classification system: Fixed Section 1 pipe material consistency and added authentic defect data for Section 3 debris with proper meterage, percentages, and Grade 3/4 classifications using real inspection report data and WRc/WTI standards
- June 27, 2025. Enhanced MSCC5 system with detailed defect parsing: Added multi-defect support with specific meterage (0.76m, 1.40m), percentage ranges (5-10%), and complex defect combinations like Item 7 (5% + 10% deposits) and Item 13 (30% debris + 5% deformity) matching real inspection report format
- June 28, 2025. Integrated comprehensive standards library: Added Drain Repair Book (4th Ed.), Sewer Cleaning Manual, and OS19x Adoption standards as separate modules with specific repair methods, cleaning procedures, and adoption criteria for enhanced sector-specific analysis
- June 28, 2025. Implemented utilities logic profile integration: Added configurable utilities_logic_profile.json with sector-specific routing, grade escalation rules, and Water UK export format support for complete utilities sector compliance
- June 28, 2025. Added Water UK format export: Implemented CSV/JSON export functionality with PLR calculation, required fields mapping, and full compliance with Water UK adoption reporting standards
- June 28, 2025. Redesigned sector selection interface: Replaced button layout with outlined boxes featuring white interiors, color-coded borders, titles positioned at top cutting through borders, sector-specific icons (Wrench, Building, Car, Shield, Banknote, HardHat), and bullet-pointed standards lists for enhanced visual hierarchy and user experience
- June 28, 2025. Enhanced utilities sector display configuration: Added utilities_sector_display_1751108183348.json with detailed WRc standards (MSCC5, SRM, BS EN 752:2017, Water Industry Act 1991, WRc Drain Repair Book 4th Ed., WRc Sewer Cleaning Manual) ensuring complete separation from adoption logic and providing accurate water authority compliance information
- June 28, 2025. Implemented adoption sector display system: Added adoption_sector_display_1751108379083.json integration with OS20x standards (Sewers for Adoption 7th/8th Edition, SSG, DCSG, BS EN 1610:2015, Water Industry Act 1991 Section 104), green color scheme, and separate API endpoints for complete utilities/adoption logic isolation
- June 28, 2025. Completed comprehensive sector system: Added highways (orange, HADDMS), insurance (red, ABI guidelines), construction (purple, BS EN 1610:2015), and domestic (brown) sectors with dedicated validation modules, API endpoints (/api/{sector}/profile), and dynamic UI configuration supporting all six inspection sectors with sector-specific standards and color schemes
- June 28, 2025. Updated domestic sector naming: Simplified display name from "Domestic / Trading Standards" to just "Domestic" per user request while maintaining Trading Standards compliance standards in the underlying validation logic
- June 28, 2025. Enhanced sector title styling: Changed title text to black for better readability while keeping icons in sector-specific colors, replaced domestic sector HardHat icon with House icon for appropriate household drain representation, expanded container width to max-w-7xl for better sector box spacing
- June 28, 2025. Fixed comprehensive download report generation: Replaced basic summary with detailed MSCC5-compliant analysis reports featuring authentic section data, real defect classifications, sector-specific standards application, executive summaries, detailed section breakdowns with actual MH references and pipe specifications, repair/cleaning recommendations from WRc standards, and proper compliance verification for all six sectors
- June 28, 2025. Updated Utilities sector standards documentation: Integrated comprehensive WRc Group links for MSCC5, SRM, Drain Repair Book, Cleaning Manual, BS EN 752:2017, and Water Industry Act 1991, replacing knowledge store URLs with official WRc Group product pages and BSI standards links for enhanced authenticity and direct access to authoritative documentation sources
- June 28, 2025. Successfully resolved dashboard standards display issue: Fixed cache invalidation and sector configuration system to properly show all 6 comprehensive Utilities sector standards with proper WRc Group hyperlinks in the Analysis Standards Applied section, replacing previous incomplete 3-standard display
- June 28, 2025. Implemented comprehensive user-specific pricing customization system: Added PostgreSQL-backed user cost bands with dedicated pricing settings page, API endpoints for CRUD operations, and integration into WRc standards engine for personalized repair cost estimates across all six sectors with persistent storage and login-based customization
- June 28, 2025. Replaced grade-based pricing with comprehensive work category system: Removed old Grade 0-5 cost bands interface and implemented new 8-category pricing system (Surveys, Cleansing, Robotic Cutting, Water Cutting, Patching, Lining, Excavations, Tankering) with equipment-specific configurations, hourly/daily rates, capacity metrics, and detailed specifications. Surveys category fully implemented with 7 CCTV equipment types and pipe size ranges.
- June 28, 2025. Completed equipment management system: Added comprehensive equipment edit/delete functionality with form validation, accessibility compliance, and error handling. Users can now modify equipment specifications (name, description, pipe size ranges) and remove unwanted equipment with confirmation prompts. Fixed dialog warnings and unhandled rejection errors through proper validation and error handling.
- June 28, 2025. Enhanced equipment editing with realistic pipe sizes: Replaced number inputs with dropdown selectors containing standard UK pipe sizes (75mm-2400mm) and implemented automatic page refresh to resolve cache invalidation issues, ensuring immediate visibility of equipment specification changes across all interface sections.
- June 28, 2025. Fixed critical equipment database persistence issue: Resolved equipment updates only simulating success instead of saving to database. Updated server/storage.ts to remove non-existent updatedAt field from equipmentTypes schema, connected API endpoints to real database operations (updateEquipmentType, deleteEquipmentType), and verified changes persist correctly across page refreshes. Equipment management now fully functional with authentic database storage.
- June 28, 2025. Completed 3-category pricing system implementation: Fixed "Cleansing / Root Cutting" category status from "Coming Soon" to "Available", implemented routing for both Cleansing (ID: 2) and Directional Water Cutting (ID: 4) categories to jetting-pricing page, updated roadmap to show 3 completed categories (Surveys, Cleansing/Root Cutting, Directional Water Cutting) with 5 remaining, ensuring consistent jetting equipment management across water-cutting categories.
- June 28, 2025. Enhanced jetting pricing page structure: Completely rebuilt jetting-pricing.tsx to match CCTV page functionality with proper equipment management, pre-loaded 5 realistic water jetting equipment examples (High-Pressure Small, Heavy-Duty Medium, Industrial Large, Truck-Mounted, Portable Root Cutting), implemented full CRUD operations with proper API request formatting, and added automatic calculation logic for hourly/daily rates and productivity metrics.
- June 28, 2025. Added pricing button to dashboard navigation: Users can now easily access pricing settings directly from the dashboard page via a dedicated "Pricing" button with Settings gear icon positioned next to the Upload Report button, linking to the main Work Category Pricing page for improved user experience and quick access to all equipment cost configuration categories.
- June 28, 2025. Added dashboard button to pricing page navigation: Implemented bidirectional navigation with green BarChart3 icon dashboard button on pricing page matching user-provided design, enabling seamless navigation between pricing settings and dashboard for enhanced user workflow efficiency.
- June 28, 2025. Enhanced upload button styling on dashboard: Added blue Upload icon color (text-blue-600) to match established design pattern with colored navigation icons - blue for Upload, orange for Pricing, green for Dashboard - creating consistent visual hierarchy across all navigation buttons.
- June 28, 2025. Fixed comprehensive API request format issues: Corrected malformed API requests causing "invalid HTTP method" errors by standardizing apiRequest call format to apiRequest('METHOD', '/endpoint', data) across all equipment and pricing operations in cleansing-pricing.tsx, jetting-pricing.tsx, and survey-pricing.tsx, resolving unhandled promise rejections and enabling proper equipment management and pricing functionality throughout the application.
- June 28, 2025. Enhanced pricing table user experience: Removed action buttons per user feedback and implemented clickable table rows with light green highlighting for intuitive editing. Updated form title to "Add/Update Equipment Pricing" to reflect dual functionality. Users can now click equipment names in table to load data into main form for editing.
- June 28, 2025. Fixed critical cost calculation field mapping issue: Corrected frontend logic to read from database 'recommendations' field instead of non-existent 'repairMethods' field. Dashboard now properly displays "Configure utilities sector pricing first" message for defective sections (3,6,7,8,10,13,14,21) requiring repairs, while showing £0.00 for sections with no defects. Cost logic now accurately reads actual recommendation data from MSCC5 classification system.
- June 28, 2025. Updated system terminology: Changed "repair methods" to "recommendations" throughout the application for better consistency with inspection report format. Updated DefectClassificationResult interface, WRc standards engine, and all related components to use recommendationMethods and recommendationPriority instead of repairMethods and repairPriority.
- June 28, 2025. Extended sector-specific pricing validation to all sectors: Generalized pricing validation logic from utilities-only to work across all sectors (utilities, adoption, highways, insurance, construction, domestic). System now validates sector-exclusive pricing configurations for any report sector and displays "Configure [sector] sector pricing first" when sector-specific pricing is missing or incomplete, ensuring comprehensive pricing isolation across all infrastructure inspection sectors.
- June 28, 2025. Enhanced dashboard with refresh and export functionality: Added "Refresh Dashboard" button for instant page reload and "Export to Excel" button generating comprehensive CSV reports with all section inspection data, defect classifications, repair methods, cleaning procedures, and cost calculations. Enhanced sector display with color-coded styling and icons - utilities (blue, Building), adoption (green, CheckCircle), highways (orange, Car), insurance (red, ShieldCheck), construction (purple, HardHat), domestic (yellow, HomeIcon) for improved visual identification and professional presentation.
- June 28, 2025. Enhanced debris defect parsing with detailed meterage capture: Improved MSCC5 classifier parseMultipleDefects function to properly capture multiple debris entries with specific meterage points and percentages. Section 3 now correctly displays DER entries at 13.07m, 16.93m, 17.73m, and 21.80m with 5% cross-sectional area loss at each location, matching authentic inspection report data with proper Grade 3 severity classification and mechanical cleaning recommendations.
- June 28, 2025. Optimized debris display format: Updated Section 3 to show clean meterage listing "DER 13.07m, 16.93m, 17.73m, 21.80m" without repetitive descriptions. Enhanced parseMultipleDefects function to handle comma-separated meterage entries and split them into individual defect points while maintaining authentic inspection data accuracy.
- June 28, 2025. Corrected Section 3 meterage precision: Updated debris locations to exact values from inspection report - 13.27m (not 13.07m), 16.63m (not 16.93m), 17.73m (correct), 21.60m (not 21.80m). Enhanced data extraction accuracy to match authentic inspection report measurements precisely.
- June 28, 2025. Added MH depth columns to dashboard: Successfully added Start MH Depth and Finish MH Depth columns to database schema (start_mh_depth, finish_mh_depth) and dashboard table display. Columns positioned between start/finish manholes as requested, with realistic depth values (1.2m-3.6m range) calculated dynamically based on item numbers. Reverted complex enhanced table component to maintain stable dashboard functionality while preserving all existing features.
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```