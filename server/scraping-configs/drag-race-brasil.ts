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
      tableSelector: 'table.wikitable',  // More specific: target tables with wikitable class
      skipFirstRow: true,  // Skip first header row (row 1 auto-skips since it has only <th> cells)
      columns: {
        dragName: {
          cellType: 'td',
          index: 1,  // Second <td> cell contains contestant name with link
          selector: 'a',  // Extract text from the link
          parser: 'trim'
        },
        age: {
          cellType: 'td',
          index: 3,  // Fourth <td> cell (Age column)
          parser: 'extractAge'
        },
        hometown: {
          cellType: 'td',
          index: 4,  // Fifth <td> cell (Location column)
          parser: 'trim'
        },
        outcome: {
          cellType: 'td',
          index: 0,  // First <td> cell contains outcome/rank (1st, 2nd, etc.)
          parser: 'extractOutcome'
        }
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
