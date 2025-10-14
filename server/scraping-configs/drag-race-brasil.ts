import { FranchiseScrapingConfig } from './types';

// Configuration for Drag Race Brasil
// Uses Fandom wiki as primary source for better data quality
export const dragRaceBrasilConfig: FranchiseScrapingConfig = {
  franchiseName: 'Drag Race Brasil',
  season: {
    // Primary configuration: Fandom Wiki
    // Fandom table structure: Rank | Contestant | Photo | Age | Location | Episodes...
    // Important: First column (Rank) is <th>, rest are <td>
    contestantTable: {
      tableSelector: 'table',  
      skipFirstRow: true,  // Skip header row with "Rank", "Contestant", etc.
      columns: {
        dragName: {
          cellType: 'td',
          index: 0,  // First <td> cell (Contestant column, since Rank is <th>)
          selector: 'a',  // Extract text from the link
          parser: 'trim'
        },
        age: {
          cellType: 'td',
          index: 2,  // Third <td> cell (Age column)
          parser: 'extractAge'
        },
        hometown: {
          cellType: 'td',
          index: 3,  // Fourth <td> cell (Location column)
          parser: 'trim'
        },
      }
    },
    
    // Alternative configuration: Wikipedia (if Fandom fails)
    // Wikipedia table structure: Contestant | Age | City | Outcome
    alternativeTables: [
      {
        tableSelector: '.wikitable',
        skipFirstRow: true,
        columns: {
          dragName: {
            cellType: 'td',
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
          outcome: {
            cellType: 'td',
            index: 3,
            parser: 'extractOutcome'
          }
        }
      }
    ]
  }
};
