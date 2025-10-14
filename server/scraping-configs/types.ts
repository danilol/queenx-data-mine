export interface ContestantRowConfig {
  // Table and row selectors
  tableSelector: string;
  rowSelector?: string;
  skipFirstRow?: boolean;
  
  // Column configuration
  columns: {
    dragName: ColumnConfig;
    age?: ColumnConfig;
    hometown?: ColumnConfig;
    realName?: ColumnConfig;
    outcome?: ColumnConfig;
  };
}

export interface ColumnConfig {
  // Selector type: 'th' for header cells, 'td' for data cells
  cellType: 'th' | 'td';
  // Index of the cell (0-based)
  index: number;
  // Optional custom selector within the cell
  selector?: string;
  // Optional custom parser function name
  parser?: 'extractAge' | 'extractOutcome' | 'trim' | 'none';
}

export interface SeasonScrapingConfig {
  // Primary table configuration (e.g., Wikipedia)
  contestantTable: ContestantRowConfig;
  
  // Alternative table configurations (e.g., Fandom wiki)
  alternativeTables?: ContestantRowConfig[];
  
  // Optional custom behavior
  waitForSelector?: string;
  screenshotPrefix?: string;
}

export interface FranchiseScrapingConfig {
  franchiseName: string;
  // Season-level configuration
  season?: SeasonScrapingConfig;
  
  // Franchise-level configuration (if scraping from franchise page)
  franchise?: {
    seasonListSelector?: string;
    seasonLinkSelector?: string;
  };
}
