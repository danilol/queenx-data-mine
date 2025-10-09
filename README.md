# 🏆 RuPaul's Drag Race Data Management System

<div align="center">

**A comprehensive, multi-level web scraping and content management system for RuPaul's Drag Race franchise data**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org/)
[![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/)

*Built with modern web technologies for scalable data collection and management*

</div>

---

## ✨ Overview

This is a full-stack web application designed to automatically scrape, organize, and manage comprehensive data from the RuPaul's Drag Race franchise. The system implements a sophisticated **hierarchical scraping approach** with real-time progress tracking, flexible data source integration, and a modern content management interface.

### 🎯 Key Highlights

- **🤖 Multi-Level Scraping**: Full → Franchise → Season → Contestant hierarchical data collection
- **🌐 Generic Source Integration**: Flexible `metadataSourceUrl` fields support Wikipedia, Fandom, official sites, and more
- **⚡ Real-Time Progress**: WebSocket-powered live updates with detailed progress tracking
- **🎨 Modern Interface**: Clean, responsive React UI with shadcn/ui components and dark mode
- **📊 Comprehensive Management**: Full CRUD operations with advanced search and filtering
- **📥 Data Export**: CSV and JSON export with complete metadata preservation
- **🔧 Developer-Friendly**: TypeScript throughout, hot reload, comprehensive debugging tools
- **🏗️ Clean Architecture**: Streamlined codebase with eliminated redundancy and consistent schema patterns

## 🏗️ System Architecture

## 🌐 API Endpoints

This section provides a detailed overview of the available API endpoints. All endpoints are prefixed with `/api`.

### Scraping Endpoints

These endpoints control the web scraping engine.

#### Start a Scraping Job

- **POST** `/api/scrape/full`
  - **Description**: Initiates a full scrape of all franchises, seasons, and contestants.
  - **Body**: `{ "options": { "headless": boolean, "screenshotsEnabled": boolean } }` (optional)

- **POST** `/api/scrape/franchise`
  - **Description**: Scrapes a specific franchise and all its seasons.
  - **Body**: `{ "franchiseId": "<franchise-uuid>", "options": { ... } }`

- **POST** `/api/scrape/season`
  - **Description**: Scrapes a specific season and its contestants.
  - **Body**: `{ "seasonId": "<season-uuid>", "options": { ... } }`

- **POST** `/api/scrape/contestant`
  - **Description**: Scrapes or re-scrapes a single contestant's detailed information.
  - **Body**: `{ "contestantId": "<contestant-uuid>", "options": { ... } }`

#### Control and Status

- **GET** `/api/scrape/status`
  - **Description**: Retrieves the real-time status of the current scraping job.
  - **Response**: A `ScrapingJobPayload` object with the current job's progress.

- **POST** `/api/scrape/stop`
  - **Description**: Stops the currently active scraping job.
  - **Response**: `{ "status": "stopped" }`

### Data Management Endpoints

These endpoints provide full CRUD (Create, Read, Update, Delete) functionality for the core data models.

#### Contestants

- **GET** `/api/contestants`
  - **Description**: Retrieves a list of all contestants. Supports filtering by `search` and `seasonId`.
- **GET** `/api/contestants/:id`
  - **Description**: Fetches a single contestant by their ID.
- **POST** `/api/contestants`
  - **Description**: Creates a new contestant.
- **PATCH** `/api/contestants/:id`
  - **Description**: Updates an existing contestant.
- **DELETE** `/api/contestants/:id`
  - **Description**: Deletes a contestant.

#### Franchises

- **GET** `/api/franchises`
- **GET** `/api/franchises/:id`
- **POST** `/api/franchises`
- **PATCH** `/api/franchises/:id`
- **DELETE** `/api/franchises/:id`

#### Seasons

- **GET** `/api/seasons`
- **GET** `/api/seasons/:id`
- **POST** `/api/seasons`
- **PATCH** `/api/seasons/:id`
- **DELETE** `/api/seasons/:id`

### Other Endpoints

- **GET** `/api/stats`
  - **Description**: Retrieves application-wide statistics (total contestants, seasons, etc.).
- **GET** `/api/export/csv`
  - **Description**: Exports all data into a downloadable CSV file.
- **GET** `/api/export/json`
  - **Description**: Exports all data into a downloadable JSON file.

### Technology Stack

| Layer | Technologies | Purpose |
|-------|-------------|---------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui | Modern responsive UI with real-time updates |
| **Backend** | Express.js, TypeScript, WebSocket, Node.js | RESTful API with real-time communication |
| **Database** | PostgreSQL, Drizzle ORM, Neon Database | Type-safe data persistence and relationships |
| **Scraping** | Playwright, Chromium, Screenshot capture | Automated web data extraction |
| **State Management** | TanStack Query, Zustand, React Context | Client-side caching and state synchronization |
| **Development** | Hot reload, ESBuild, PostCSS, TypeScript compiler | Fast development experience |

### Multi-Level Scraping Architecture

```mermaid
graph TD
    A[Full Scrape] --> B[Franchise Discovery]
    B --> C[Season Detection]
    C --> D[Contestant Extraction]
    D --> E[Data Storage]
    
    F[Custom URL Input] --> G[Level Selection]
    G --> H[Targeted Scraping]
    H --> E
    
    E --> I[Real-time Progress]
    I --> J[WebSocket Broadcast]
    J --> K[UI Updates]
```

### Data Flow

1. **User Interface**: React components trigger scraping operations
2. **API Layer**: Express routes validate requests and manage scraping jobs
3. **Scraping Engine**: Playwright navigates and extracts data from web sources
4. **WebSocket Layer**: Real-time progress updates broadcast to connected clients
5. **Database Layer**: Drizzle ORM handles type-safe data persistence
6. **Export System**: Generate CSV/JSON exports with comprehensive metadata

## 📋 Prerequisites

| Requirement | Version | Required | Notes |
|-------------|---------|----------|--------|
| **Node.js** | 18.0.0+ | ✅ Yes | JavaScript runtime environment |
| **npm/yarn** | Latest | ✅ Yes | Package manager (npm comes with Node.js) |
| **PostgreSQL** | 13+ | ⚪ Optional | Uses in-memory storage by default |
| **Git** | 2.0+ | ✅ Yes | Version control system |
| **System deps** | OS-specific | ⚪ Optional | For Playwright browser automation |

### System Dependencies by Platform

<details>
<summary><strong>🐧 Ubuntu/Debian Linux</strong></summary>

```bash
# Essential dependencies
sudo apt-get update
sudo apt-get install -y \
  libglib2.0-0 libnspr4 libnss3 libdbus-1-3 \
  libatk1.0-0 libatk-bridge2.0-0 libcups2 \
  libxcb1 libxkbcommon0 libatspi2.0-0 \
  libx11-6 libxcomposite1 libxdamage1 \
  libxext6 libxfixes3 libxrandr2 libgbm1 \
  libcairo2 libpango-1.0-0 libasound2
```
</details>

<details>
<summary><strong>🍎 macOS</strong></summary>

Most dependencies come with Xcode Command Line Tools:
```bash
xcode-select --install
```
</details>

<details>
<summary><strong>🪟 Windows</strong></summary>

Most dependencies are included with Windows. Ensure you have:
- Visual Studio Build Tools or Visual Studio Community
- Windows SDK
</details>

## 🚀 Quick Start Guide

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repository-url>
cd rupaul-drag-race-scraper

# Install all dependencies
npm install
```

### Step 2: Environment Setup

Create a `.env` file in the root directory:

```bash
# Database Configuration (Optional - uses in-memory storage by default)
DATABASE_URL="postgresql://username:password@localhost:5432/drag_race_db"

# Server Configuration  
NODE_ENV=development
PORT=3000

# Scraper Configuration
USE_REAL_SCRAPER=true         # Set to false for demo mode with mock data
SCREENSHOTS_DIR=./screenshots # Directory for debug screenshots

# Feature Toggles
ENABLE_WEBSOCKET=true        # Real-time progress updates
ENABLE_SCREENSHOTS=true      # Debug screenshot capture
PLAYWRIGHT_HEADLESS=true     # Run browser in background
```

### Step 3: Playwright Browser Installation (Optional)

For full web scraping functionality:

```bash
# Install Chromium browser for Playwright
npx playwright install chromium

# Install system dependencies (Linux/Ubuntu only)
sudo npx playwright install-deps
```

> **💡 Pro Tip**: Skip this step to use demo mode with mock data for development

### Step 4: Database Setup (Optional)

For persistent storage with PostgreSQL:

```bash
# Create database
createdb drag_race_db

# Push schema to database
npm run db:push
```

> **💡 Default**: The app uses in-memory storage that works immediately without setup

### Step 5: Launch the Application

```bash
# Start development server with hot reload
npm run dev
```

🎉 **Success!** Open [http://localhost:3000](http://localhost:3000) in your browser

### 🎯 First Steps After Launch

1. **📊 Dashboard**: View overview statistics and system status
2. **🤖 Scraper**: Test the multi-level scraping interface
3. **👥 Contestants**: Browse and manage scraped data
4. **📥 Export**: Download data in CSV or JSON format

---

## 🌟 Features Deep Dive

### 🔄 Multi-Level Scraping System

The application features a sophisticated hierarchical scraping approach that allows for targeted data collection at different levels:

| Scraping Level | Description | Use Case |
|---------------|-------------|----------|
| **🌍 Full Scrape** | Complete franchise data collection | Initial data population |
| **🏢 Franchise Scrape** | All seasons within a specific franchise | US, UK, Canada, etc. |
| **📺 Season Scrape** | Individual season contestants | Specific season updates |
| **👤 Contestant Scrape** | Single contestant details | Individual data refresh |

#### Custom URL Input
- **Dynamic URL Field**: Appears when selecting specific scraping levels
- **URL Validation**: Ensures proper format and accessibility
- **Source Flexibility**: Supports Wikipedia, Fandom Wiki, official sites, and more
- **Smart Detection**: Automatically determines scraping strategy based on URL structure

### 📊 Real-Time Progress Tracking

```typescript
// Progress update structure
interface ProgressUpdate {
  jobId: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number;        // 0-100 percentage
  totalItems: number;      // Total items to process
  processedItems: number;  // Items completed
  currentItem: string;     // Currently processing
  message: string;         // Human-readable status
  timeElapsed: number;     // Milliseconds since start
  estimatedRemaining: number; // Estimated time left
}
```

### 🎨 Modern User Interface

#### Dashboard Overview
- **Statistics Cards**: Real-time counts of contestants, seasons, franchises
- **Recent Activity**: Latest scraping operations and data updates
- **System Status**: Database connectivity, scraper health, WebSocket status
- **Quick Actions**: One-click access to common operations

#### Contestant Management
- **Advanced Search**: Filter by name, franchise, season, outcome
- **Bulk Operations**: Multi-select for batch updates or deletions
- **Inline Editing**: Quick edits without modal dialogs
- **Photo Management**: Automatic photo URL extraction and display
- **Data Validation**: Type-safe forms with real-time validation

#### Dark Mode Support
- **System Detection**: Automatically follows OS preference
- **Manual Toggle**: Switch themes with persistent storage
- **Consistent Theming**: All components support both light and dark modes
- **Accessible Colors**: WCAG-compliant contrast ratios

### 📥 Comprehensive Data Export

#### CSV Export Features
- **Spreadsheet Ready**: Compatible with Excel, Google Sheets, Numbers
- **Custom Columns**: Select specific fields for export
- **Data Formatting**: Proper escaping and encoding for international characters
- **Timestamp Metadata**: Export time and data source information

#### JSON Export Features
- **Complete Structure**: Full data with relationships and metadata
- **Type Preservation**: Maintains proper data types (numbers, booleans, dates)
- **Hierarchical Data**: Nested objects for complex relationships
- **Schema Validation**: Conforms to defined JSON schema

### 🔧 Developer Experience

#### Hot Reload & Type Safety
- **Instant Updates**: Frontend and backend hot reload
- **TypeScript Throughout**: Full type safety across the stack
- **Shared Types**: Consistent data models between client and server
- **Error Boundaries**: Graceful error handling with detailed messages

#### Debugging Tools
- **Screenshot Capture**: Visual debugging for scraping operations
- **Detailed Logging**: Structured logs with different levels
- **WebSocket Inspector**: Real-time connection monitoring
- **Database Query Logging**: Track all database operations

#### Testing & Validation
- **Mock Scraper**: Demo mode with realistic sample data
- **Type Validation**: Runtime validation with Zod schemas
- **Error Simulation**: Test error handling scenarios
- **Performance Monitoring**: Track scraping speed and resource usage

---

## 📖 User Guide

### 🎯 Getting Started: Your First Scraping Session

1. **Navigate to Scraper Page**
   - Click **"Scraper"** in the sidebar navigation
   - You'll see the multi-level scraping interface

2. **Choose Your Scraping Level**
   ```
   📋 Scraping Level Dropdown Options:
   ┌─ 🌍 Full Scrape        → Complete franchise collection
   ├─ 🏢 Franchise Scrape   → All seasons in a franchise  
   ├─ 📺 Season Scrape      → Single season contestants
   └─ 👤 Contestant Scrape  → Individual contestant data
   ```

3. **Configure Settings**
   - **Headless Mode**: ✅ Recommended for production (faster, less resource usage)
   - **Screenshots**: ✅ Enable for debugging (captures visual state during scraping)

4. **Add Custom URL (for targeted levels)**
   - When selecting Franchise/Season/Contestant levels
   - Input field appears for specific URL targeting
   - Supports: Wikipedia, Fandom Wiki, official franchise sites

5. **Start Scraping**
   - Click the dynamic action button (text updates based on selected level)
   - Monitor real-time progress in the progress panel
   - WebSocket provides live updates with current status

### 👥 Managing Contestant Data

#### Viewing and Searching
```bash
# Search capabilities
- Name search: "RuPaul", "Symone", "Lawrence Chaney"
- Franchise filter: "US", "UK", "Canada", "Down Under"  
- Season filter: "Season 13", "UK Series 2"
- Outcome filter: "Winner", "Runner-up", "ELIM"
```

#### Editing Contestant Information
1. **Inline Editing**: Click the edit icon on any contestant row
2. **Modal Form**: Comprehensive form with validation
3. **Photo Updates**: Modify photo URLs with live preview
4. **Data Validation**: Type-safe forms prevent invalid data entry

#### Bulk Operations
- **Multi-select**: Use checkboxes to select multiple contestants
- **Batch Delete**: Remove multiple records with confirmation
- **Export Selection**: Download only selected contestants

### 📊 Data Export Workflows

#### CSV Export for Spreadsheet Analysis
```csv
dragName,realName,age,franchise,season,outcome,photoUrl,sourceUrl
Symone,Reggie Garrette,25,US,Season 13,Winner,https://...,https://...
Lawrence Chaney,Lawrence Chaney,24,UK,UK Series 2,Winner,https://...,https://...
```

#### JSON Export for Development
```json
{
  "exportMetadata": {
    "timestamp": "2024-08-11T22:15:00.000Z",
    "totalRecords": 150,
    "dataSource": "RuPaul's Drag Race Management System",
    "exportType": "complete"
  },
  "contestants": [
    {
      "id": 1,
      "dragName": "Symone",
      "realName": "Reggie Garrette",
      "age": 25,
      "franchise": "US",
      "season": "Season 13",
      "outcome": "Winner",
      "photoUrl": "https://...",
      "sourceUrl": "https://en.wikipedia.org/...",
      "isScraped": true
    }
  ]
}
```

### 🔧 Advanced Configuration

#### Custom Data Sources

Add new scraping sources by updating the data structure:

```typescript
// In server/services/scraper.ts or server/services/mock-scraper.ts
const customSources = [
  {
    name: "Drag Race Down Under Season 3",
    sourceUrl: "https://en.wikipedia.org/wiki/RuPaul%27s_Drag_Race_Down_Under_(season_3)",
    franchise: "Down Under",
    year: 2024
  },
  {
    name: "Drag Race Philippines Season 3", 
    sourceUrl: "https://drag-race.fandom.com/wiki/RuPaul%27s_Drag_Race_Philippines_(Season_3)",
    franchise: "Philippines",
    year: 2024
  }
];
```

#### Environment Variables Reference

```bash
# Core Configuration
NODE_ENV=development              # Environment mode
PORT=3000                        # Server port
DATABASE_URL=postgresql://...     # PostgreSQL connection string

# Scraper Behavior  
USE_REAL_SCRAPER=true            # true: Playwright, false: Mock data
PLAYWRIGHT_HEADLESS=true         # Browser visibility
SCREENSHOTS_DIR=./screenshots    # Screenshot storage path
PLAYWRIGHT_SLOW_MO=0            # Delay between actions (ms)

# Feature Toggles
ENABLE_WEBSOCKET=true           # Real-time progress updates
ENABLE_SCREENSHOTS=true         # Debug screenshot capture
ENABLE_EXPORT=true             # Data export functionality

# Debug Settings
DEBUG=scraper:*                # Enable scraper debugging
DEBUG=pw:*                     # Enable Playwright debugging  
DEBUG=*                        # Enable all debugging
```

#### Database Schema Customization

The flexible schema supports extending with additional fields:

```typescript
// In shared/schema.ts
export const contestants = pgTable('contestants', {
  id: serial('id').primaryKey(),
  dragName: text('drag_name').notNull(),
  realName: text('real_name'),
  age: integer('age'),
  franchise: text('franchise').notNull(),
  season: text('season').notNull(),
  outcome: text('outcome'),
  photoUrl: text('photo_url'),
  metadataSourceUrl: text('metadata_source_url').notNull(), // Generic field for any source
  isScraped: boolean('is_scraped').default(false),
  
  // Custom fields you can add:
  hometown: text('hometown'),
  profession: text('profession'),
  socialMedia: text('social_media'),
  lipSyncRecord: text('lip_sync_record'),
  challengeWins: integer('challenge_wins'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});
```

---

## 🛠️ Development Guide

### Project Structure Overview

```bash
📦 rupaul-drag-race-scraper/
├── 📁 client/                    # React frontend application
│   ├── 📁 src/
│   │   ├── 📁 components/        # Reusable UI components
│   │   │   ├── 📁 ui/           # shadcn/ui component library
│   │   │   ├── 📁 layout/       # Header, sidebar, navigation
│   │   │   └── 📄 *.tsx         # Custom components
│   │   ├── 📁 hooks/            # Custom React hooks
│   │   ├── 📁 lib/              # Utilities and configurations
│   │   ├── 📁 pages/            # Page components
│   │   └── 📄 App.tsx           # Main application component
│   └── 📄 index.html            # HTML entry point
├── 📁 server/                   # Express backend application
│   ├── 📁 data/                 # Static data and configurations
│   ├── 📁 services/             # Business logic services
│   │   ├── 📄 scraper.ts        # Real Playwright scraper
│   │   ├── 📄 mock-scraper.ts   # Demo/development scraper
│   │   └── 📄 websocket.ts      # WebSocket service
│   ├── 📄 api.ts                # Express routes and middleware
│   ├── 📄 index.ts              # Server entry point
│   ├── 📄 storage.ts            # Database abstractions
│   └── 📄 vite.ts               # Vite integration
├── 📁 shared/                   # Shared types and schemas
│   └── 📄 schema.ts             # Database schema with Drizzle
├── 📄 package.json              # Dependencies and scripts
├── 📄 tsconfig.json             # TypeScript configuration
├── 📄 tailwind.config.ts        # Tailwind CSS configuration
├── 📄 vite.config.ts            # Vite build configuration
├── 📄 drizzle.config.ts         # Database ORM configuration
└── 📄 .env                      # Environment variables
```

### Available Scripts

| Command | Description | Usage |
|---------|-------------|--------|
| `npm run dev` | Start development server | Development with hot reload |
| `npm run build` | Build for production | Creates optimized bundles |
| `npm run start` | Run production build | Serves built application |
| `npm run check` | TypeScript type checking | Validates types across project |
| `npm run db:push` | Push schema to database | Updates database structure |
| `npm run db:generate` | Generate migration files | Creates migration scripts |

### Adding New Features

#### 1. Adding a New Page
```typescript
// 1. Create page component in client/src/pages/
// client/src/pages/new-feature.tsx
export default function NewFeaturePage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">New Feature</h1>
      {/* Your component content */}
    </div>
  );
}

// 2. Register route in App.tsx
import NewFeaturePage from './pages/new-feature';

function App() {
  return (
    <Router>
      <Route path="/new-feature" component={NewFeaturePage} />
      {/* Other routes */}
    </Router>
  );
}

// 3. Add navigation link in components/layout/sidebar.tsx
const navigationItems = [
  // ... existing items
  {
    title: "New Feature",
    url: "/new-feature",
    icon: YourIcon
  }
];
```

#### 2. Adding New API Endpoints
```typescript
// 1. Add route in server/api.ts
app.get('/api/new-endpoint', async (req, res) => {
  try {
    const data = await storage.getNewData();
    res.json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Add storage method in server/storage.ts
interface IStorage {
  // ... existing methods
  getNewData(): Promise<NewDataType[]>;
}

// 3. Add client-side API call in client/src/lib/api.ts
export const newDataApi = {
  getAll: () => apiRequest<NewDataType[]>('/api/new-endpoint'),
  create: (data: CreateNewDataType) => 
    apiRequest<NewDataType>('/api/new-endpoint', {
      method: 'POST',
      body: JSON.stringify(data)
    })
};
```

#### 3. Extending Database Schema
```typescript
// 1. Update schema in shared/schema.ts
export const newTable = pgTable('new_table', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  // ... other fields
});

// 2. Generate types
export const insertNewTableSchema = createInsertSchema(newTable);
export type InsertNewTable = z.infer<typeof insertNewTableSchema>;
export type NewTable = typeof newTable.$inferSelect;

// 3. Push changes to database
npm run db:push
```

### Code Style Guidelines

#### TypeScript Best Practices
```typescript
// ✅ Good: Use proper typing
interface ContestantData {
  dragName: string;
  realName?: string;
  age?: number;
}

// ✅ Good: Use Zod for validation
const contestantSchema = z.object({
  dragName: z.string().min(1),
  realName: z.string().optional(),
  age: z.number().min(18).max(100).optional()
});

// ❌ Avoid: Using 'any' type
const data: any = await fetch('/api/contestants');

// ✅ Good: Proper error handling
try {
  const result = await scrapingOperation();
  return result;
} catch (error) {
  console.error('Scraping failed:', error);
  throw new Error(`Scraping failed: ${error.message}`);
}
```

#### React Component Patterns
```typescript
// ✅ Good: Functional components with proper typing
interface ContestantCardProps {
  contestant: Contestant;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export function ContestantCard({ contestant, onEdit, onDelete }: ContestantCardProps) {
  return (
    <Card className="p-4">
      <h3 className="font-semibold">{contestant.dragName}</h3>
      {/* Component content */}
    </Card>
  );
}

// ✅ Good: Custom hooks for reusable logic
export function useContestants() {
  return useQuery({
    queryKey: ['/api/contestants'],
    queryFn: () => apiRequest<Contestant[]>('/api/contestants')
  });
}
```

---

## 🐛 Troubleshooting Guide

### Common Issues and Solutions

#### 1. Playwright Browser Installation Issues

**Problem**: `browserType.launch: Executable doesn't exist`
```bash
Error: browserType.launch: Executable doesn't exist at /home/user/.cache/ms-playwright/chromium-1097/chrome-linux/chrome
```

**Solutions**:
```bash
# Install Chromium browser
npx playwright install chromium

# Install system dependencies (Linux/Ubuntu)
sudo npx playwright install-deps

# Verify installation
npx playwright --version

# Alternative: Use mock scraper
echo "USE_REAL_SCRAPER=false" >> .env
```

#### 2. Database Connection Problems

**Problem**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solutions**:
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Start PostgreSQL service
sudo systemctl start postgresql

# Use in-memory storage instead
# Remove or comment out DATABASE_URL in .env file

# Verify database exists
psql -l | grep drag_race_db
```

#### 3. Port Conflicts

**Problem**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solutions**:
```bash
# Find process using port 3000
lsof -ti:3000

# Kill existing process
lsof -ti:3000 | xargs kill -9

# Use different port
echo "PORT=3001" >> .env

# Check available ports
netstat -tuln | grep LISTEN
```

#### 4. WebSocket Connection Failures

**Problem**: `WebSocket connection to 'ws://localhost:3000/ws' failed`

**Solutions**:
```bash
# Check server logs for WebSocket errors
DEBUG=ws:* npm run dev

# Verify WebSocket endpoint
curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Key: test" \
     -H "Sec-WebSocket-Version: 13" \
     http://localhost:3000/ws

# Disable WebSocket temporarily
echo "ENABLE_WEBSOCKET=false" >> .env
```

#### 5. Build and Compilation Errors

**Problem**: TypeScript compilation failures

**Solutions**:
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for type mismatches
npm run check

# Verify all dependencies are installed
npm list --depth=0
```

### Debug Mode Instructions

#### Enable Comprehensive Debugging
```bash
# Full application debugging
DEBUG=* npm run dev

# Specific service debugging
DEBUG=scraper:*,ws:*,db:* npm run dev

# Playwright-specific debugging
DEBUG=pw:* PLAYWRIGHT_HEADLESS=false npm run dev
```

#### Log Analysis
```bash
# View server logs with timestamps
npm run dev 2>&1 | tee server.log

# Filter for specific log levels
npm run dev 2>&1 | grep -E "(ERROR|WARN)"

# Monitor database queries
DEBUG=drizzle:* npm run dev

# WebSocket connection debugging
DEBUG=ws:* npm run dev | grep -E "(connection|disconnect|error)"
```

#### Performance Monitoring
```bash
# Monitor scraping performance
time npm run dev

# Check memory usage
NODE_OPTIONS="--max-old-space-size=4096" npm run dev

# Profile application
NODE_OPTIONS="--inspect" npm run dev
# Then visit chrome://inspect in Chrome
```

### Browser Automation Debugging

#### Visual Debugging Mode
```typescript
// In server/services/scraper.ts - enable visual mode
const browser = await playwright.chromium.launch({
  headless: false,           // Show browser window
  devtools: true,           // Open DevTools
  slowMo: 1000,            // Slow down actions
});
```

#### Screenshot Debugging
```bash
# Enable screenshots for all operations
echo "ENABLE_SCREENSHOTS=true" >> .env
echo "SCREENSHOTS_DIR=./debug-screenshots" >> .env

# View captured screenshots
ls -la debug-screenshots/
open debug-screenshots/  # macOS
xdg-open debug-screenshots/  # Linux
```

#### Network Traffic Analysis
```typescript
// Add to scraper for network monitoring
page.on('request', request => {
  console.log('Request:', request.url());
});

page.on('response', response => {
  console.log('Response:', response.url(), response.status());
});
```

---

## 🚀 Production Deployment

### Deployment Checklist

#### Pre-Deployment Requirements
- [ ] **Environment Variables**: All production secrets configured
- [ ] **Database**: PostgreSQL instance running and accessible
- [ ] **Browser Dependencies**: Playwright browsers installed on server
- [ ] **Build Process**: Successful production build
- [ ] **Performance Testing**: Load testing completed
- [ ] **Security Review**: Authentication and authorization implemented

#### Production Environment Variables
```bash
# Essential Production Configuration
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@prod-db-host:5432/drag_race_prod

# Security
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars
SESSION_SECRET=your-session-secret-min-32-chars
CORS_ORIGIN=https://yourdomain.com

# Scraper Configuration
USE_REAL_SCRAPER=true
PLAYWRIGHT_HEADLESS=true
SCREENSHOTS_DIR=/app/screenshots
MAX_CONCURRENT_SCRAPERS=3

# Performance
CACHE_TTL=3600
DB_POOL_SIZE=20
WS_MAX_CONNECTIONS=100

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
LOG_LEVEL=info
HEALTH_CHECK_PORT=3001
```

### Docker Deployment

#### Multi-Stage Dockerfile
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY . .
RUN npm run build

# Production stage  
FROM node:18-alpine AS production

# Install Playwright dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Set Playwright to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001
USER nextjs

EXPOSE 3000
CMD ["npm", "start"]
```

#### Docker Compose Configuration
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/drag_race_prod
    depends_on:
      - db
      - redis
    volumes:
      - screenshots:/app/screenshots
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=drag_race_prod
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  screenshots:
```

### Cloud Platform Deployments

#### Vercel Deployment
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "client/**/*",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/client/index.html"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "DATABASE_URL": "@database-url"
  }
}
```

#### Railway Deployment
```toml
# railway.toml
[build]
builder = "nixpacks"

[deploy]
healthcheckPath = "/api/health"
healthcheckTimeout = 300
restartPolicyType = "on_failure"

[[services]]
name = "web"
```

#### Render Deployment
```yaml
# render.yaml
services:
- type: web
  name: drag-race-scraper
  env: node
  buildCommand: npm install && npm run build
  startCommand: npm start
  envVars:
  - key: NODE_ENV
    value: production
  - key: DATABASE_URL
    fromDatabase:
      name: drag-race-db
      property: connectionString
```

### Performance Optimization

#### Application Performance
```typescript
// Server optimizations
app.use(compression());
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));

// Database connection pooling
const db = drizzle(postgres(process.env.DATABASE_URL!, {
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10
}));

// Caching strategy
const redis = new Redis(process.env.REDIS_URL);
```

#### Frontend Optimizations
```typescript
// Code splitting
const LazyContestantsPage = lazy(() => import('./pages/contestants'));
const LazyScraperPage = lazy(() => import('./pages/scraper'));

// Service worker for caching
// public/sw.js
self.addEventListener('fetch', event => {
  if (event.request.url.includes('/api/contestants')) {
    event.respondWith(
      caches.open('api-cache').then(cache => {
        return cache.match(event.request) || 
               fetch(event.request).then(response => {
                 cache.put(event.request, response.clone());
                 return response;
               });
      })
    );
  }
});
```

### Monitoring and Logging

#### Health Check Endpoint
```typescript
// server/api.ts
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      scraper: 'unknown',
      websocket: 'unknown'
    }
  };

  try {
    // Check database
    await storage.healthCheck();
    health.services.database = 'healthy';
  } catch (error) {
    health.services.database = 'unhealthy';
    health.status = 'error';
  }

  res.status(health.status === 'ok' ? 200 : 503).json(health);
});
```

#### Structured Logging
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

---

## 🤝 Contributing

### Development Workflow

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/rupaul-drag-race-scraper.git
   cd rupaul-drag-race-scraper
   ```

2. **Setup Development Environment**
   ```bash
   npm install
   cp .env.example .env
   npm run dev
   ```

3. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make Changes and Test**
   ```bash
   npm run check          # Type checking
   npm run test           # Run tests (if applicable)
   npm run build          # Verify build works
   ```

5. **Commit and Push**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Use clear, descriptive title
   - Include details about changes made
   - Reference any related issues

### Code Standards

- **TypeScript**: Strict mode enabled, no `any` types
- **ESLint**: Follow existing configuration
- **Prettier**: Code formatting consistency
- **Commit Messages**: Follow conventional commit format

### Areas for Contribution

- **New Data Sources**: Add support for additional franchise websites
- **UI Improvements**: Enhance user experience and accessibility
- **Performance**: Optimize scraping speed and database queries
- **Testing**: Add comprehensive test coverage
- **Documentation**: Improve guides and API documentation

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### MIT License Summary
- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Private use
- ❌ Liability
- ❌ Warranty

---

## 🙏 Acknowledgments

- **RuPaul's Drag Race**: Inspiration for this data collection project
- **Playwright Team**: Excellent browser automation framework
- **shadcn/ui**: Beautiful, accessible component library
- **Drizzle Team**: Type-safe ORM that makes database work enjoyable
- **Open Source Community**: All the amazing libraries that made this possible

---

<div align="center">

**Built with ❤️ for the drag community**

*"You better work!" - RuPaul*

[⬆️ Back to Top](#-rupauls-drag-race-data-management-system)

</div>

## 🛠️ Development

### Available Scripts

- `npm run dev`: Starts the development server with hot-reloading.
- `npm run build`: Bundles the app for production.
- `npm run start`: Runs the production build.
- `npm run check`: Type-checks the project.
- `npm run db:push`: Pushes schema changes to the database.

### Project Structure

```
.env                # Environment variables
drizzle.config.ts   # Drizzle ORM configuration
package.json        # Project dependencies and scripts
postcss.config.js     # PostCSS configuration
tailwind.config.ts  # Tailwind CSS configuration
tsconfig.json       # TypeScript configuration
vite.config.ts      # Vite configuration
client/             # Frontend React application
server/             # Backend Express.js application
shared/             # Code shared between client and server
```

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📜 License

This project is licensed under the MIT License.


## 🎯 Usage

### Starting a Scraping Session

1. **Navigate to Scraper Page**: Click "Scraper" in the sidebar
2. **Configure Settings**: 
   - Toggle headless mode (recommended: ON for production)
   - Enable screenshots for debugging
3. **Start Scraping**: Click "Start Demo Scraping" button
4. **Monitor Progress**: Watch real-time updates in the progress panel

### Managing Contestant Data

1. **View Contestants**: Go to "Contestants" page
2. **Edit Data**: Click edit button on any contestant row
3. **Delete Records**: Use delete button (with confirmation)
4. **Search**: Use the search bar to filter contestants

### Exporting Data

1. **Go to Export Page**: Click "Export" in sidebar
2. **Choose Format**: 
   - **CSV**: Spreadsheet-compatible format
   - **JSON**: Structured data with full metadata
3. **Download**: Files include timestamp in filename

## 🔧 Configuration

### Scraper Settings

```typescript
// In client/src/pages/scraper.tsx
const scrapingOptions = {
  headless: true,        // Run browser in background
  screenshotsEnabled: true, // Capture debug screenshots
  maxConcurrency: 1      // Parallel scraping sessions
};
```

### WebSocket Configuration

```typescript
// In server/services/websocket.ts
const WS_CONFIG = {
  path: '/ws',           // WebSocket endpoint
  pingInterval: 30000,   // Keep-alive ping
  maxReconnectAttempts: 5
};
```

### Database Schema

The application uses these main tables:
- **contestants**: Drag performer data
- **seasons**: Show season information  
- **scraping_jobs**: Scraping operation logs

## 🚀 Production Deployment

### TODOs for Production

#### 1. Security & Authentication
- [ ] Implement user authentication (JWT or session-based)
- [ ] Add rate limiting for API endpoints
- [ ] Set up CORS policies for production domains
- [ ] Enable HTTPS/TLS encryption
- [ ] Add input validation and sanitization
- [ ] Implement API key protection for sensitive endpoints

#### 2. Database & Performance
- [ ] Set up PostgreSQL production database
- [ ] Configure database connection pooling
- [ ] Add database migrations system
- [ ] Implement data backup strategy
- [ ] Add database indexing for search queries
- [ ] Set up database monitoring and logging

#### 3. Infrastructure & Scaling
- [ ] Configure production environment variables
- [ ] Set up Docker containerization
- [ ] Implement horizontal scaling with load balancer
- [ ] Add Redis for session storage and caching
- [ ] Set up CDN for static assets
- [ ] Configure log aggregation (ELK stack or similar)

#### 4. Monitoring & Reliability
- [ ] Add application performance monitoring (APM)
- [ ] Implement error tracking (Sentry or similar)
- [ ] Set up health check endpoints
- [ ] Add graceful shutdown handling
- [ ] Configure alerts for system failures
- [ ] Implement backup and disaster recovery

#### 5. Browser Automation (Playwright)
- [ ] Install production browser dependencies:
  ```bash
  # Ubuntu/Debian
  sudo apt-get install libglib2.0-0 libnspr4 libnss3 libdbus-1-3 \
    libatk1.0-0 libatk-bridge2.0-0 libcups2 libxcb1 libxkbcommon0 \
    libatspi2.0-0 libx11-6 libxcomposite1 libxdamage1 libxext6 \
    libxfixes3 libxrandr2 libgbm1 libcairo2 libpango-1.0-0 libasound2
  ```
- [ ] Configure browser pool for concurrent scraping
- [ ] Set up browser crash recovery
- [ ] Implement scraping queue system
- [ ] Add proxy rotation for large-scale scraping

#### 6. Data Management
- [ ] Implement data validation and cleaning
- [ ] Add duplicate detection and merging
- [ ] Set up automated data backups
- [ ] Create data archiving strategy
- [ ] Implement data retention policies

### Production Environment Setup

```bash
# Production environment variables
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@prod-db:5432/drag_race_prod
REDIS_URL=redis://prod-redis:6379
USE_REAL_SCRAPER=true

# Security
JWT_SECRET=your-super-secure-jwt-secret
SESSION_SECRET=your-session-secret
API_RATE_LIMIT=100

# External Services
SENTRY_DSN=your-sentry-dsn
CDN_URL=https://your-cdn.com
```

### Docker Deployment

```dockerfile
# Dockerfile example
FROM node:18-alpine

# Install Playwright dependencies
RUN apk add --no-cache \
  chromium \
  nss \
  freetype \
  freetype-dev \
  harfbuzz \
  ca-certificates \
  ttf-freefont

# Set Playwright to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Playwright Browser Not Found
```bash
Error: browserType.launch: Executable doesn't exist
```
**Solution**: Install Playwright browsers and dependencies
```bash
npx playwright install chromium
sudo npx playwright install-deps
```

#### 2. WebSocket Connection Failed
```bash
WebSocket connection to 'ws://localhost:3000/ws' failed
```
**Solution**: Ensure server is running and WebSocket path is correct

#### 3. Database Connection Error
```bash
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution**: Check PostgreSQL is running or use in-memory storage

#### 4. Port Already in Use
```bash
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution**: Kill existing process or change port
```bash
lsof -ti:3000 | xargs kill -9
```

### Debug Mode

Enable verbose logging:
```bash
# Full debug mode
DEBUG=* npm run dev

# Playwright-specific debugging
DEBUG=pw:* npm run dev

# Scraper-specific debugging  
DEBUG=scraper:* npm run dev
```

### Playwright-Specific Debugging

```bash
# Run with browser visible (non-headless)
PLAYWRIGHT_HEADLESS=false npm run dev

# Enable slow motion for better observation
PLAYWRIGHT_SLOW_MO=1000 npm run dev

# Save videos of scraping sessions
PLAYWRIGHT_VIDEO=true npm run dev
```

## 🔍 Playwright Debugging

### Visual Debugging Mode

For development and troubleshooting, you can run Playwright in non-headless mode to see the browser in action:

```typescript
// In server/services/scraper.ts
const options = {
  headless: false,        // Show browser window
  screenshotsEnabled: true, // Capture screenshots
  slowMo: 500            // Slow down actions (milliseconds)
};
```

### Debug Console Output

Enable detailed logging for scraping operations:

```bash
# Enable Playwright debug logs
DEBUG=pw:* npm run dev

# Enable only browser logs
DEBUG=pw:browser npm run dev

# Enable application debug logs
DEBUG=scraper:* npm run dev
```

### Screenshot Analysis

Screenshots are automatically saved to `./screenshots/` directory during scraping:

```bash
# View captured screenshots
ls -la screenshots/
open screenshots/  # macOS
xdg-open screenshots/  # Linux
```

### Interactive Debugging

For step-by-step debugging, you can pause execution and inspect the page:

```typescript
// Add breakpoints in scraper code
await page.pause(); // Opens Playwright Inspector

// Take manual screenshots
await page.screenshot({ path: 'debug.png', fullPage: true });

// Inspect element selectors
const element = await page.locator('selector').first();
console.log(await element.textContent());
```

### Common Debugging Techniques

1. **Selector Testing**: Use browser DevTools to test CSS selectors
2. **Network Inspection**: Monitor requests in browser Network tab
3. **Console Logs**: Check for JavaScript errors on scraped pages
4. **Element Waiting**: Use `page.waitForSelector()` for dynamic content

## 📝 Data Sources & Adding New URLs

### Current Data Sources

- **Wikipedia**: Primary source for contestant information
- **RuPaul's Drag Race Fandom Wiki**: Additional details
- **Future**: Official franchise websites, social media APIs

### Adding a New Scraping Source

To add a new URL or data source, follow these steps:

#### 1. Update Season Data Structure

First, add your new source to the season data in `server/services/scraper.ts`:

```typescript
// In scrapeWikipediaDragRaceData method
const seasonData = [
  {
    name: "RuPaul's Drag Race Season 16",
    url: "https://en.wikipedia.org/wiki/RuPaul%27s_Drag_Race_(season_16)",
    franchise: "US",
    year: 2024
  },
  {
    name: "Drag Race UK Season 5", 
    url: "https://en.wikipedia.org/wiki/RuPaul%27s_Drag_Race_UK_(series_5)",
    franchise: "UK",
    year: 2023
  },
  // Add your new source here:
  {
    name: "Your New Season",
    url: "https://your-new-source.com/drag-race-data",
    franchise: "NEW",
    year: 2024
  }
];
```

#### 2. Create Source-Specific Scraper Method

Create a dedicated scraper method for different website structures:

```typescript
// Add to RuPaulScraper class
private async scrapeCustomSource(page: Page, seasonData: any, jobId: string) {
  try {
    await page.goto(seasonData.url, { waitUntil: 'networkidle' });
    
    // Wait for content to load
    await page.waitForSelector('.contestant-table', { timeout: 10000 });
    
    // Custom selectors for your source
    const rows = await page.locator('.contestant-row').all();
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      // Extract data based on your source's HTML structure
      const dragName = await row.locator('.drag-name').textContent() || '';
      const realName = await row.locator('.real-name').textContent() || '';
      const age = await row.locator('.age').textContent() || '';
      
      // Broadcast progress
      broadcastProgress({
        jobId,
        status: "running",
        progress: Math.round(((i + 1) / rows.length) * 100),
        totalItems: rows.length,
        message: `Processing: ${dragName}`,
        currentItem: dragName
      });
      
      // Save to database
      await storage.createContestant({
        dragName: dragName.trim(),
        realName: realName.trim() || null,
        age: this.extractAge(age),
        season: seasonData.name,
        franchise: seasonData.franchise,
        wikipediaUrl: seasonData.url,
        isScraped: true
      });
      
      // Optional: Take screenshot for debugging
      if (this.screenshotDir) {
        await this.takeScreenshot(page, `contestant_${i}_${dragName.replace(/\s+/g, '_')}`);
      }
    }
    
  } catch (error) {
    console.error(`Error scraping ${seasonData.name}:`, error);
    throw error;
  }
}
```

#### 3. Update Main Scraper Logic

Modify the main scraping loop to handle different sources:

```typescript
// In scrapeWikipediaDragRaceData method
for (const season of seasonData) {
  try {
    // Determine scraper method based on URL or source type
    if (season.url.includes('wikipedia.org')) {
      await this.scrapeSingleSeason(page, season, jobId);
    } else if (season.url.includes('your-new-source.com')) {
      await this.scrapeCustomSource(page, season, jobId);
    } else if (season.url.includes('fandom.com')) {
      await this.scrapeFandomSource(page, season, jobId);
    } else {
      console.warn(`Unknown source type for: ${season.url}`);
      continue;
    }
    
    // Mark season as scraped
    await storage.createSeason({
      name: season.name,
      franchise: season.franchise,
      year: season.year,
      wikipediaUrl: season.url,
      isScraped: true
    });
    
  } catch (error) {
    console.error(`Failed to scrape season ${season.name}:`, error);
    // Continue with next season instead of failing completely
  }
}
```

#### 4. Handle Different Data Formats

Add utility methods for data extraction specific to your source:

```typescript
// Add utility methods to RuPaulScraper class
private extractAgeFromCustomSource(text: string): number | null {
  // Custom age extraction logic for your source
  const ageMatch = text.match(/Age:\s*(\d+)/i);
  return ageMatch ? parseInt(ageMatch[1]) : null;
}

private extractOutcomeFromCustomSource(text: string): string | null {
  // Custom outcome extraction logic
  if (text.toLowerCase().includes('winner')) return 'Winner';
  if (text.toLowerCase().includes('runner-up')) return 'Runner-up';
  // Add more mappings as needed
  return text.trim() || null;
}

private async extractPhotoUrl(page: Page, containerSelector: string): Promise<string | null> {
  try {
    const img = await page.locator(`${containerSelector} img`).first();
    return await img.getAttribute('src');
  } catch {
    return null;
  }
}
```

#### 5. Test Your New Source

Create a test method to verify your scraper works:

```typescript
// Add to development/testing
async testNewSource() {
  const testSeason = {
    name: "Test Season",
    url: "https://your-new-source.com/test-page",
    franchise: "TEST",
    year: 2024
  };
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await this.scrapeCustomSource(page, testSeason, 'test-job');
    console.log('✓ New source scraper working correctly');
  } catch (error) {
    console.error('✗ New source scraper failed:', error);
  } finally {
    await browser.close();
  }
}
```

#### 6. Update Mock Data (Optional)

If you want to test with mock data first, add sample data to `server/services/mock-scraper.ts`:

```typescript
// Add to SAMPLE_CONTESTANTS array
const NEW_SOURCE_CONTESTANTS = [
  {
    dragName: "Test Queen",
    realName: "Test Person",
    age: 25,
    hometown: "Test City",
    season: "Your New Season",
    franchise: "NEW",
    outcome: "Contestant",
    biography: "Sample biography from new source",
    photoUrl: null,
    wikipediaUrl: "https://your-new-source.com"
  }
];
```

### Best Practices for New Sources

1. **Respect Rate Limits**: Add delays between requests
2. **Handle Errors Gracefully**: Don't let one page failure stop entire scraping
3. **Validate Data**: Check for required fields before saving
4. **Use Specific Selectors**: Avoid generic selectors that might break
5. **Test Thoroughly**: Always test with headless=false first
6. **Document Selectors**: Comment your CSS selectors for future maintenance

### Example: Adding Drag Race Thailand

```typescript
// Complete example for adding a new franchise
{
  name: "Drag Race Thailand Season 3",
  url: "https://en.wikipedia.org/wiki/Drag_Race_Thailand_(season_3)",
  franchise: "Thailand",
  year: 2021
}

// Custom scraper method would handle Thai names and local data format
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes and test thoroughly
4. Commit with descriptive messages: `git commit -m "Add feature X"`
5. Push to branch: `git push origin feature-name`
6. Submit a pull request

### Code Style

- Use TypeScript for all new code
- Follow existing ESLint configuration
- Add JSDoc comments for complex functions
- Write unit tests for new features
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- RuPaul's Drag Race franchise for the amazing content
- Playwright team for the browser automation framework
- shadcn/ui for the beautiful component library
- The drag community for inspiration

---

## 🆘 Support

If you encounter any issues:

1. Check this README for common solutions
2. Search existing GitHub issues
3. Create a new issue with:
   - Operating system and Node.js version
   - Error messages and logs
   - Steps to reproduce the problem
   - Expected vs actual behavior

**Happy scraping!** 🏳️‍⚧️✨