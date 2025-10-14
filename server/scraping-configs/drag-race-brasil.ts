import { FranchiseScrapingConfig } from './types';

// Configuration for Drag Race Brasil
// Brasil Wikipedia tables have: Contestant | Age | City | Outcome
// No "Real Name" column exists in Brasil tables
export const dragRaceBrasilConfig: FranchiseScrapingConfig = {
  franchiseName: 'Drag Race Brasil',
  season: {
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
        // No realName column in Brasil tables - omitted
        outcome: {
          cellType: 'td',
          index: 3,  // Fourth column (or use -1 for last)
          parser: 'extractOutcome'
        }
      }
    }
  }
};
