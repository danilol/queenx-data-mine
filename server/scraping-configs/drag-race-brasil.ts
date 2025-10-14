import { FranchiseScrapingConfig } from './types';

// Configuration for Drag Race Brasil
// Note: This is a starting template - adjust selectors based on actual Wikipedia structure
export const dragRaceBrasilConfig: FranchiseScrapingConfig = {
  franchiseName: 'Drag Race Brasil',
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
          index: -1,
          parser: 'extractOutcome'
        }
      }
    }
  }
};
