# Replit Architecture Documentation

## Rev v6.2 - Production Clean State (January 2025)
**Lock-in Checkpoint**: All synthetic data eliminated, debug buttons removed, zero synthetic data policy enforced.

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