# Scraping Configuration System

This directory contains customizable scraping configurations for different RuPaul's Drag Race franchises. Each franchise can have its own specific selectors and parsing rules to handle varying Wikipedia page structures.

## How It Works

The scraper automatically loads the appropriate configuration based on the franchise being scraped. If no specific configuration exists for a franchise, it falls back to the default configuration.

## File Structure

- **`types.ts`** - TypeScript interfaces defining the configuration structure
- **`default.ts`** - Default configuration used as fallback
- **`drag-race-us.ts`** - Configuration for RuPaul's Drag Race (US)
- **`drag-race-brasil.ts`** - Configuration for Drag Race Brasil
- **`index.ts`** - Registry that manages all configurations

## Creating a New Franchise Configuration

1. Create a new file: `server/scraping-configs/franchise-name.ts`

2. Define your configuration:

```typescript
import { FranchiseScrapingConfig } from './types';

export const myFranchiseConfig: FranchiseScrapingConfig = {
  franchiseName: 'Drag Race [Country]',
  season: {
    contestantTable: {
      // CSS selector for the contestant table
      tableSelector: '.wikitable',
      
      // Optional: Custom row selector (default: 'tr')
      rowSelector: 'tr',
      
      // Skip the first row (usually headers)
      skipFirstRow: true,
      
      columns: {
        // Drag name column
        dragName: {
          cellType: 'th',    // 'th' or 'td'
          index: 0,          // Column index (0-based)
          parser: 'trim'     // Parser to use
        },
        
        // Age column (optional)
        age: {
          cellType: 'td',
          index: 0,
          parser: 'extractAge'  // Extracts age number
        },
        
        // Hometown column (optional)
        hometown: {
          cellType: 'td',
          index: 1,
          parser: 'trim'
        },
        
        // Real name column (optional)
        realName: {
          cellType: 'td',
          index: 2,
          parser: 'trim'
        },
        
        // Outcome column (optional)
        outcome: {
          cellType: 'td',
          index: -1,  // -1 means last column
          parser: 'extractOutcome'  // Extracts winner/runner-up/eliminated
        }
      }
    }
  }
};
```

3. Register your configuration in `index.ts`:

```typescript
import { myFranchiseConfig } from './my-franchise';

const configRegistry: Map<string, FranchiseScrapingConfig> = new Map([
  ['RuPaul\'s Drag Race', dragRaceUSConfig],
  ['Drag Race Brasil', dragRaceBrasilConfig],
  ['Drag Race [Country]', myFranchiseConfig],  // Add this line
]);
```

## Configuration Options

### Column Configuration

Each column has these properties:

- **`cellType`**: `'th'` for header cells or `'td'` for data cells
- **`index`**: Column position (0-based). Use `-1` for the last column
- **`selector`** (optional): CSS selector within the cell
- **`parser`** (optional): How to parse the text:
  - `'trim'`: Remove whitespace
  - `'extractAge'`: Extract age number from text
  - `'extractOutcome'`: Extract outcome (Winner/Runner-up/Eliminated)
  - `'none'`: No parsing

### Table Configuration

- **`tableSelector`**: CSS selector for the contestant table (e.g., `.wikitable`)
- **`rowSelector`** (optional): Selector for table rows (default: `'tr'`)
- **`skipFirstRow`**: Whether to skip the first row (usually headers)

## Testing Your Configuration

1. Update the configuration file for your franchise
2. Run a scrape for that franchise
3. Check the logs to see extracted data:
   ```
   [scraper] Extracted data - Name: [Name], Age: [Age], Hometown: [City], Real Name: [Name], Outcome: [Result]
   ```
4. Adjust selectors and parsers as needed

## Tips for Finding Selectors

1. Open the Wikipedia page in a browser
2. Right-click on the contestant table → Inspect
3. Look at the HTML structure to identify:
   - Table class (e.g., `class="wikitable"`)
   - Header cells (`<th>`) vs data cells (`<td>`)
   - Column order and indices

## Example: Debugging Brasil Configuration

If Drag Race Brasil has a different table structure:

1. Inspect the Wikipedia page
2. Update `drag-race-brasil.ts`:

```typescript
export const dragRaceBrasilConfig: FranchiseScrapingConfig = {
  franchiseName: 'Drag Race Brasil',
  season: {
    contestantTable: {
      tableSelector: '.wikitable.sortable',  // Different selector
      skipFirstRow: true,
      columns: {
        dragName: {
          cellType: 'td',  // Name might be in <td> not <th>
          index: 0,
          parser: 'trim'
        },
        realName: {
          cellType: 'td',
          index: 1,
          parser: 'trim'
        },
        // Age column doesn't exist in Brasil
        hometown: {
          cellType: 'td',
          index: 2,
          parser: 'trim'
        },
        outcome: {
          cellType: 'td',
          index: -1,
          parser: 'extractOutcome'
        }
      }
    }
  }
};
```

3. Test the scrape again

## Workflow

1. **Scrape a franchise** → Check what data is extracted
2. **If data is wrong** → Inspect Wikipedia page structure
3. **Update configuration** → Adjust selectors/parsers
4. **Test again** → Verify correct data extraction
5. **Repeat** for each franchise until data quality is acceptable
