# RuPaul's Drag Race Scraper & CMS

A comprehensive web scraping system for RuPaul's Drag Race franchise data with real-time debugging and CMS functionality. Built with Playwright for browser automation, featuring WebSocket-powered live progress tracking, and a modern React interface.

## 🌟 Features

- **Playwright-Powered Web Scraping**: Automated data collection from Wikipedia and other sources
- **Real-Time Progress Tracking**: WebSocket connections for live scraping updates
- **Visual Debugging**: Screenshot capture during scraping for troubleshooting
- **Full CMS Functionality**: Create, read, update, and delete contestant data
- **Data Export**: Export collected data in CSV and JSON formats
- **Incremental Scraping**: Resume scraping operations without data duplication
- **Modern UI**: Clean, responsive interface built with React and shadcn/ui
- **Database Integration**: PostgreSQL support with Drizzle ORM

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript + WebSocket
- **Database**: PostgreSQL + Drizzle ORM
- **Web Scraping**: Playwright (Chromium)
- **Real-time**: WebSocket connections
- **Development**: Hot module replacement, TypeScript compilation

## 📋 Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** or **yarn** package manager
- **PostgreSQL** 13+ (optional - uses in-memory storage by default)
- **System Dependencies** for Playwright (see installation section)

## 🚀 Quick Start

### 1. Clone and Install Dependencies

```bash
git clone <your-repository-url>
cd rupaul-drag-race-scraper
npm install
```

### 2. Install Playwright Browser

```bash
# Install Chromium browser for Playwright
npx playwright install chromium

# Install system dependencies (Linux/Ubuntu)
sudo npx playwright install-deps
```

**For other operating systems:**
- **macOS**: Dependencies usually come with Xcode Command Line Tools
- **Windows**: Most dependencies are included with Windows

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
# Database (optional - uses in-memory storage by default)
DATABASE_URL="postgresql://username:password@localhost:5432/drag_race_db"

# Server Configuration
NODE_ENV=development
PORT=3000

# Scraper Configuration
USE_REAL_SCRAPER=true  # Set to false to use demo mode
SCREENSHOTS_DIR=./screenshots

# Enable/Disable Features
ENABLE_WEBSOCKET=true
ENABLE_SCREENSHOTS=true
```

### 4. Database Setup (Optional)

If you want to use PostgreSQL instead of in-memory storage:

```bash
# Create database
createdb drag_race_db

# Run migrations (if using database)
npm run db:push
```

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🛠️ Development

### Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Run type checking
npm run type-check

# Database operations (if using PostgreSQL)
npm run db:generate  # Generate migrations
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio
```

### Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Route components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and API client
│   │   └── main.tsx       # Application entry point
│   └── index.html
├── server/                # Express backend
│   ├── services/          # Business logic
│   │   ├── scraper.ts     # Playwright scraper
│   │   ├── mock-scraper.ts # Demo data generator
│   │   └── websocket.ts   # Real-time communications
│   ├── storage.ts         # Data persistence layer
│   ├── routes.ts          # API route definitions
│   └── index.ts          # Server entry point
├── shared/               # Shared types and schemas
│   └── schema.ts         # Database schema and types
└── screenshots/          # Captured screenshots (auto-created)
```

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