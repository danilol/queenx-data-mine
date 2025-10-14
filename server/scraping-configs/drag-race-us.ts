import { FranchiseScrapingConfig } from './types';

// Configuration for RuPaul's Drag Race (US)
export const dragRaceUSConfig: FranchiseScrapingConfig = {
  franchiseName: 'RuPaul\'s Drag Race',
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
