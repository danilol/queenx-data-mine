# Overview

This is a RuPaul's Drag Race contestant scraping and management system built as a full-stack web application. The system automatically scrapes contestant data from Wikipedia using Playwright web automation, stores it in a PostgreSQL database, and provides a modern web interface for viewing and managing the collected data. The application features real-time progress tracking during scraping operations, comprehensive contestant profiles with photos and biographical information, and data export capabilities.

## Recent Changes (August 2025)

- **Enhanced Image Scraping System**: ✓ Resolved incomplete gallery downloads by implementing lazy loading support for fandom wiki images. The scraper now extracts URLs from `data-src` and `data-image-src` attributes (used by lazy loading), includes page scrolling to trigger image loading, filters out lazy loading placeholders, and handles multiple URL fallbacks with extended timeouts (30s). Added automatic privacy dialog handling for GDPR/consent banners, realistic browser headers to avoid bot detection, and comprehensive error logging. This fixes the core issue where gallery images weren't being found due to lazy loading implementation on fandom pages.
- **Image Display System Completed**: ✓ Successfully resolved S3 image access issues by implementing presigned URL redirects that bypass ListBucket permission requirements. Images now display properly through secure, time-limited URLs that work with the existing AWS IAM configuration. Created colorful SVG placeholder images (200x200) with descriptive text labels that browsers can display properly, replacing the previous tiny PNG files that appeared as broken images.

- **Unified Dashboard Interface**: ✓ Merged Dashboard and Scraper pages into a single unified interface, eliminating duplication and creating a comprehensive control center. The new dashboard includes scraping controls at the top, enhanced progress visualization, stats, configuration, and development tools in a logical priority order.
- **Enhanced Dashboard Layout and Progress Visualization**: ✓ Reordered dashboard sections to prioritize scraping progress at the top per user requirements, with development tools moved to bottom. Implemented comprehensive progress visualization with real-time counters for franchises, seasons, and contestants, processing rate metrics, time estimation, and hierarchical progress breakdown for large datasets (1000+ records).
- **Improved Scraping Progress Component**: ✓ Created enhanced progress visualization with gradients, icons, live counters updating every 2 seconds during active scraping, performance metrics, and detailed progress breakdown for better handling of large-scale scraping operations.
- **Automatic Image Scraping Integration**: ✓ Implemented intelligent automatic image scraping that triggers whenever a fandom URL is successfully found and saved to the database, controlled by the image scraping configuration setting. Works for both new contestant creation (during scraping) and manual fandom URL lookup operations. Operates asynchronously without blocking API responses.
- **Image Scraping Configuration System**: ✓ Complete configuration management system with API endpoints (/api/config) and dashboard UI controls for toggling image scraping on/off. Configuration persists across sessions and updates in real-time throughout the application.
- **Image Tracking and Visualization System**: ✓ Comprehensive image tracking with database fields (hasImages, imageCount, imageUrls, lastImageScrapeAt) to monitor successful downloads, image gallery displays on contestant detail pages with click-to-open functionality, and status indicators in management tables showing image counts.
- **Smart Image Deduplication**: ✓ Implemented hash-based deduplication system preventing duplicate images in S3 bucket. Uses MD5 content hashing to generate consistent file names, checks for existing files before upload, and efficiently skips duplicate uploads while maintaining proper tracking across contestants.
- **UI Streamlining**: ✓ Removed redundant "Download Images" button from contestant detail pages since "Scrape Contestant" already handles automatic image downloading when fandom URLs are found, creating a cleaner and more intuitive interface.
- **Code Cleanup Completed**: ✓ Removed all redundant and obsolete components including standalone view pages, unused modal components, and legacy progress visualization components while maintaining full functionality through management pages
- **Schema Standardization**: ✓ Updated entire codebase to use consistent `metadataSourceUrl` field names across all components, services, and data files for better maintainability
- **Component Architecture Cleanup**: ✓ Eliminated duplicated functionality by consolidating all CRUD operations into dedicated management pages with proper navigation structure

- **Fandom URL Auto-Population**: ✓ Implemented intelligent fandom URL lookup system that automatically populates `metadata_source_url` with RuPaul's Drag Race Fandom wiki URLs for new contestants during scraping
- **Fallback URL Construction**: ✓ Added fallback mechanism to construct fandom URLs when browser automation is unavailable, ensuring functionality in all environments
- **Manual Fandom URL Lookup**: ✓ Added API endpoint `/api/contestants/:id/lookup-fandom-url` and frontend button to manually search and populate fandom URLs for existing contestants without metadata source URLs
- **Smart Contestant Creation**: ✓ Enhanced scraping system to check if contestants already exist before attempting fandom URL lookup, preventing redundant processing
- **Testing Completed**: ✓ Successfully tested with BenDeLaCreme, Latrice Royale, Courtney Act, and Trixie Mattel - all now have proper fandom wiki URLs populated automatically
- **Mock Image Scraping Integration**: ✓ Successfully integrated automatic image scraping into contestant scraping process, with 5 mock images uploaded to S3 per contestant when fandom URLs are present. Fixed S3 upload errors and verified end-to-end functionality in environments without Playwright browser automation. Images are properly organized in S3 with contestant-specific folders and timestamped filenames.
- **Protection Logic**: ✓ System intelligently protects existing metadata URLs from being overwritten, only populates fandom URLs for contestants without any metadata source URL

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
Interface priority: Scraping progress visualization is more important than settings/configuration sections.
User feedback: Eliminate duplicated information between pages - prefer unified interfaces.

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