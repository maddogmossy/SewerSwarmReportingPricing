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
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```