# Overview

This is a RuPaul's Drag Race contestant scraping and management system built as a full-stack web application. The system automatically scrapes contestant data from Wikipedia using Playwright web automation, stores it in a PostgreSQL database, and provides a modern web interface for viewing and managing the collected data. The application features real-time progress tracking during scraping operations, comprehensive contestant profiles with photos and biographical information, and data export capabilities.

## Recent Changes (August 2025)

- **Image Scraping Integration**: Successfully implemented intelligent contestant image downloading with S3 upload functionality and organized folder structure
- **S3 File Upload Integration**: Successfully implemented complete AWS S3 upload functionality with secure credential management and testing interface on Dashboard - fully operational
- **File Upload Endpoints**: Added `/api/s3/upload` for file uploads and `/api/s3/test` for connection testing with proper error handling - both endpoints working
- **AWS SDK Integration**: Configured S3Service with AWS SDK client, supporting multiple file types with timestamped keys and organized folder structure in uploads/ directory
- **Upload Testing UI**: Added interactive file upload interface to Dashboard with progress indicators, file selection, and success/error notifications - tested successfully
- **Environment Security**: Properly configured AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME, AWS_REGION) via Replit secrets with correct IAM permissions
- **Dedicated Detail Pages**: Implemented scalable detail/edit pages at `/manage/franchises/:id`, `/manage/seasons/:id`, and `/manage/contestants/:id` for comprehensive editing as forms grow with more fields
- **Enhanced Navigation**: Added "View Details" buttons to all management pages linking to dedicated detail pages for better user experience
- **Expandable Hierarchical Data**: Added expandable rows with chevron icons in management pages to show related data (franchises → seasons → contestants → appearances)
- **Complete CRUD Operations**: Full create, read, update, delete operations across all entities with proper validation and error handling
- **Related Data Display**: Shows seasons under franchises, contestants under seasons, and appearances under contestants with navigation links
- **Comprehensive CMS Implementation**: Transformed application into full content management system with CRUD operations for all entities (Franchises, Seasons, Contestants, Appearances)
- **Unified Navigation**: Simplified menu structure by consolidating view and management pages into single unified entries without duplication
- **Management Pages**: Created dedicated management interfaces for all data entities with inline editing, search, and batch operations
- **Enhanced Database Operations**: Added complete CRUD API endpoints and storage methods for all entities with proper validation
- **Contestant-Level Scraping Buttons**: Added individual "Scrape Contestant" buttons to each contestant row in the contestants list page for targeted scraping
- **Season-Level Scraping Buttons**: Added individual "Scrape Season" buttons to each season row in the seasons list page for targeted scraping
- **Hierarchical Progress Display**: Implemented detailed franchise → season → contestant progress tracking with collapsible tree view
- **Mock Scraper Integration**: Automatically falls back to mock scraper when Playwright dependencies are unavailable, ensuring functionality in all environments
- **Multi-Level Scraping Interface**: Added comprehensive scraping controls with dropdown selector for Full/Franchise/Season/Contestant levels
- **Database Schema Improvements**: Removed unused `photo_url` column and renamed all `source_url` columns to `metadata_source_url` for clarity and consistency
- **Flexible Database Schema**: Updated all tables to use generic `sourceUrl` field instead of hardcoded `wikipediaUrl` for maximum flexibility across data sources
- **Custom URL Input**: Added dynamic URL input field for targeted scraping at specific levels with validation
- **Enhanced UX**: Button text updates dynamically based on selected scraping level, clear descriptions for each option
- **Fixed Database Migration**: Successfully renamed all URL fields across franchises, seasons, and contestants tables
- **Demo Mode**: Mock scraper demonstrates multi-level functionality with sample data when Playwright dependencies unavailable
- **Comprehensive Documentation**: Created extensive README with professional presentation, detailed user guides, troubleshooting, development workflows, and production deployment instructions

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side is built with React and TypeScript using Vite as the build tool. The UI leverages shadcn/ui components built on top of Radix UI primitives for a consistent, accessible design system. Styling is handled through Tailwind CSS with custom CSS variables for theming. State management uses TanStack Query (React Query) for server state synchronization and caching. Client-side routing is implemented with Wouter for lightweight navigation. Real-time updates are handled through WebSocket connections for live scraping progress.

## Backend Architecture
The server is built with Express.js and TypeScript, following a modular structure with separate concerns for routing, storage, and business logic. The API provides RESTful endpoints for CRUD operations on contestants, seasons, and scraping jobs. WebSocket integration enables real-time communication for progress updates during scraping operations. The scraping engine uses Playwright for browser automation with configurable options for headless mode and screenshot capture.

## Data Storage Solutions
The application uses PostgreSQL as the primary database with Drizzle ORM for type-safe database operations and schema management. The database schema includes tables for contestants, seasons, and scraping jobs with proper relationships and indexing. Database migrations are handled through Drizzle Kit. For development and testing, an in-memory storage implementation is provided as an alternative to the database.

## Authentication and Authorization
Currently, the application operates without authentication, designed for single-user or trusted environment deployment. All API endpoints are publicly accessible. This architectural decision prioritizes simplicity for the current use case but can be extended with authentication middleware when needed.

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL database hosting
- **Drizzle ORM**: Type-safe database toolkit and query builder

### File Storage
- **AWS S3**: Object storage service for file uploads and management
- **AWS SDK**: Official AWS JavaScript SDK for S3 operations

### Web Scraping
- **Playwright**: Browser automation for web scraping with Chromium engine
- **Wikipedia**: Primary data source for contestant information

### UI Framework
- **Radix UI**: Unstyled, accessible UI component primitives
- **shadcn/ui**: Pre-built component library based on Radix UI
- **Tailwind CSS**: Utility-first CSS framework

### Build Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type-safe JavaScript development
- **esbuild**: JavaScript bundler for production builds

### Runtime Services
- **Node.js**: Server runtime environment
- **WebSocket**: Real-time bidirectional communication
- **Express.js**: Web application framework

### Development Tools
- **Replit**: Cloud development environment integration
- **PostCSS**: CSS processing with Autoprefixer