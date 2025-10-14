import { FranchiseScrapingConfig } from './types';

// Configuration for Drag Race Brasil
// Supports both Wikipedia and Fandom wiki pages
export const dragRaceBrasilConfig: FranchiseScrapingConfig = {
  franchiseName: 'Drag Race Brasil',
  season: {
    // Primary configuration: Wikipedia
    // Wikipedia table structure: Contestant | Age | City | Outcome
    contestantTable: {
      tableSelector: '.wikitable',
      skipFirstRow: true,
      columns: {
        dragName: {
          cellType: 'td',  // Brasil uses <td> for all cells including names
          index: 0,
          parser: 'trim'
        },
        age: {
          cellType: 'td',
          index: 1,
          parser: 'extractAge'
        },
        hometown: {
          cellType: 'td',
          index: 2,
          parser: 'trim'
        },
        // No realName column in Wikipedia Brasil tables
        outcome: {
          cellType: 'td',
          index: 3,
          parser: 'extractOutcome'
        }
      }
    },
    
    // Alternative configuration: Fandom Wiki
    // Fandom table structure: Rank | Contestant | Photo | Age | Location | Episodes...
    alternativeTables: [
      {
        tableSelector: 'table',  // Fandom uses generic table
        skipFirstRow: true,  // Skip header row
        columns: {
          dragName: {
            cellType: 'td',
            index: 1,  // Second column (Contestant)
            selector: 'a',  // Extract from link text
            parser: 'trim'
          },
          age: {
            cellType: 'td',
            index: 3,  // Fourth column (Age)
            parser: 'extractAge'
          },
          hometown: {
            cellType: 'td',
            index: 4,  // Fifth column (Location)
            parser: 'trim'
          },
          // Fandom doesn't have outcome in the main contestant table
        }
      }
    ]
  }
};
