# Overview
This is a RuPaul's Drag Race contestant scraping and management system built as a full-stack web application. The system automatically scrapes contestant data from Wikipedia using Playwright web automation, stores it in a PostgreSQL database, and provides a modern web interface for viewing and managing the collected data. The application features real-time progress tracking during scraping operations, comprehensive contestant profiles with photos and biographical information, and data export capabilities. The business vision is to create a comprehensive content management system for RuPaul's Drag Race data, with potential for broader entertainment data management.

## Recent Performance Improvements (October 2025)
- **Multi-Source Scraping Support** (Oct 14, 2025): Extended configuration system to support alternative table configurations (Wikipedia + Fandom wiki). Scraper now tries primary config first, then automatically falls back to alternative configs if no contestants found. Fixed critical bug where alternative configs were ignored during scraping.
- **Customizable Scraping Configs** (Oct 2025): Implemented franchise-specific scraping configurations in `server/scraping-configs/` to handle varying Wikipedia HTML structures. Each franchise can define custom selectors, column mappings, and parsing rules.
- **S3 Bucket Structure**: Implemented uploads/ prefix level for better organization (queenx-app-bucket/uploads/contestants/)
- **Scraping Performance**: Eliminated unnecessary double URL checking when scraping contestants with existing metadata_source_url
- **Image Display**: Enhanced gallery with object-contain (no cropping), 256px height, and proper click-to-expand functionality  
- **Image Filtering**: Fixed overly aggressive filtering that excluded legitimate contestant photos (GingerMinjAS10.jpg, etc.)

# User Preferences
Preferred communication style: Simple, everyday language.
Interface priority: Scraping progress visualization is more important than settings/configuration sections.
User feedback: Eliminate duplicated information between pages - prefer unified interfaces.

# System Architecture

## Frontend Architecture
The client-side is built with React and TypeScript using Vite. The UI leverages shadcn/ui components built on top of Radix UI primitives for a consistent, accessible design system. Styling is handled through Tailwind CSS. State management uses TanStack Query (React Query) for server state synchronization and caching. Client-side routing is implemented with Wouter. Real-time updates are handled through WebSocket connections for live scraping progress. Key UI/UX decisions include a unified dashboard interface, enhanced progress visualization with real-time counters, and expandable hierarchical data displays. SVG placeholder images are used for missing images.

## Backend Architecture
The server is built with Express.js and TypeScript, following a modular structure. The API provides RESTful endpoints for CRUD operations and scraping jobs. WebSocket integration enables real-time communication for progress updates. The scraping engine uses Playwright for browser automation with configurable options. Intelligent automatic image scraping is integrated, triggering when a fandom URL is found. The system includes smart image deduplication using hash-based methods and intelligent fandom URL lookup with fallback mechanisms.

### Scraping Configuration System
Each franchise can have customized scraping rules stored in `server/scraping-configs/`. Configurations define:
- Table and row selectors specific to each franchise's Wikipedia structure
- Column mappings (drag name, age, hometown, real name, outcome) with cell types and indices
- Custom parsing rules per column (trim, extractAge, extractOutcome)
- Alternative table configurations for multi-source scraping (e.g., Wikipedia + Fandom wiki)
- Fallback to default configuration when franchise-specific config doesn't exist
The scraper automatically tries the primary configuration first, then falls back to alternative configurations if no contestants are found. This allows fine-tuning data extraction quality franchise-by-franchise and supports multiple data sources without modifying core scraper code.

## Data Storage Solutions
The application uses PostgreSQL as the primary database with Drizzle ORM for type-safe operations and schema management. The database schema includes tables for contestants, seasons, and scraping jobs. Database migrations are handled through Drizzle Kit. An in-memory storage implementation is available for development. All `source_url` columns have been standardized to `metadata_source_url` for consistency.

## Authentication and Authorization
Currently, the application operates without authentication, designed for single-user or trusted environment deployment. All API endpoints are publicly accessible.

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL database hosting
- **Drizzle ORM**: Type-safe database toolkit and query builder

## File Storage
- **AWS S3**: Object storage service for file uploads and management
- **AWS SDK**: Official AWS JavaScript SDK for S3 operations

## Web Scraping
- **Playwright**: Browser automation for web scraping with Chromium engine
- **Wikipedia**: Primary data source for contestant information

## UI Framework
- **Radix UI**: Unstyled, accessible UI component primitives
- **shadcn/ui**: Pre-built component library based on Radix UI
- **Tailwind CSS**: Utility-first CSS framework

## Build Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type-safe JavaScript development
- **esbuild**: JavaScript bundler for production builds

## Runtime Services
- **Node.js**: Server runtime environment
- **WebSocket**: Real-time bidirectional communication
- **Express.js**: Web application framework