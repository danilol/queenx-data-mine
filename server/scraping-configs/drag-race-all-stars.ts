import { FranchiseScrapingConfig } from './types';

// Configuration for RuPaul's Drag Race All Stars
// All Stars uses Fandom wiki with a slightly different table structure
// Table structure: Contestant | Photo | Age | Hometown | Original Season | Outcome
export const dragRaceAllStarsConfig: FranchiseScrapingConfig = {
  franchiseName: "RuPaul's Drag Race All Stars",
  season: {
    contestantTable: {
      tableSelector: 'table.wikitable',
      skipFirstRow: true,
      columns: {
        dragName: {
          cellType: 'td',
          index: 0,
          selector: 'a',
          parser: 'trim'
        },
        age: {
          cellType: 'td',
          index: 2,
          parser: 'extractAge'
        },
        hometown: {
          cellType: 'td',
          index: 3,
          parser: 'trim'
        },
        outcome: {
          cellType: 'td',
          index: -1,
          parser: 'extractOutcome'
        }
      }
    },
    alternativeTables: [
      {
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
            index: -1,
            parser: 'extractOutcome'
          }
        }
      }
    ]
  }
};
