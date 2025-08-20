# Overview
This is a RuPaul's Drag Race contestant scraping and management system built as a full-stack web application. The system automatically scrapes contestant data from Wikipedia using Playwright web automation, stores it in a PostgreSQL database, and provides a modern web interface for viewing and managing the collected data. The application features real-time progress tracking during scraping operations, comprehensive contestant profiles with photos and biographical information, and data export capabilities. The business vision is to create a comprehensive content management system for RuPaul's Drag Race data, with potential for broader entertainment data management.

# User Preferences
Preferred communication style: Simple, everyday language.
Interface priority: Scraping progress visualization is more important than settings/configuration sections.
User feedback: Eliminate duplicated information between pages - prefer unified interfaces.

# System Architecture

## Frontend Architecture
The client-side is built with React and TypeScript using Vite. The UI leverages shadcn/ui components built on top of Radix UI primitives for a consistent, accessible design system. Styling is handled through Tailwind CSS. State management uses TanStack Query (React Query) for server state synchronization and caching. Client-side routing is implemented with Wouter. Real-time updates are handled through WebSocket connections for live scraping progress. Key UI/UX decisions include a unified dashboard interface, enhanced progress visualization with real-time counters, and expandable hierarchical data displays. SVG placeholder images are used for missing images.

## Backend Architecture
The server is built with Express.js and TypeScript, following a modular structure. The API provides RESTful endpoints for CRUD operations and scraping jobs. WebSocket integration enables real-time communication for progress updates. The scraping engine uses Playwright for browser automation with configurable options. Intelligent automatic image scraping is integrated, triggering when a fandom URL is found. The system includes smart image deduplication using hash-based methods and intelligent fandom URL lookup with fallback mechanisms.

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