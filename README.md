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
PORT=5000

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

The application will be available at `http://localhost:5000`

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
WebSocket connection to 'ws://localhost:5000/ws' failed
```
**Solution**: Ensure server is running and WebSocket path is correct

#### 3. Database Connection Error
```bash
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution**: Check PostgreSQL is running or use in-memory storage

#### 4. Port Already in Use
```bash
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**: Kill existing process or change port
```bash
lsof -ti:5000 | xargs kill -9
```

### Debug Mode

Enable verbose logging:
```bash
DEBUG=* npm run dev
```

## 📝 Data Sources

Currently scrapes from:
- **Wikipedia**: Primary source for contestant information
- **RuPaul's Drag Race Fandom Wiki**: Additional details
- **Future**: Official franchise websites, social media APIs

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