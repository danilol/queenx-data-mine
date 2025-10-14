import { FranchiseScrapingConfig } from './types';

// Default configuration that works for most standard Wikipedia tables
export const defaultConfig: FranchiseScrapingConfig = {
  franchiseName: 'default',
  season: {
    contestantTable: {
      tableSelector: '.wikitable',
      skipFirstRow: true,
      columns: {
        dragName: {
          cellType: 'th',
          index: 0,
          parser: 'trim'
        },
        age: {
          cellType: 'td',
          index: 0,
          parser: 'extractAge'
        },
        hometown: {
          cellType: 'td',
          index: 1,
          parser: 'trim'
        },
        realName: {
          cellType: 'td',
          index: 2,
          parser: 'trim'
        },
        outcome: {
          cellType: 'td',
          index: -1, // Last cell
          parser: 'extractOutcome'
        }
      }
    }
  }
};
