import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertCircle, Loader2, BarChart3, PieChart } from "lucide-react";

interface ContestantStatus {
  name: string;
  status: "pending" | "running" | "completed" | "failed";
}

interface SeasonStatus {
  name: string;
  franchiseName: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  contestants?: ContestantStatus[];
  totalContestants?: number;
  completedContestants?: number;
}

interface FranchiseStatus {
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  seasons?: SeasonStatus[];
  totalSeasons?: number;
  completedSeasons?: number;
}

interface ScrapingStatusData {
  status: "idle" | "running" | "completed" | "failed";
  level?: "full" | "franchise" | "season" | "contestant";
  progress: number;
  currentFranchise?: string;
  currentSeason?: string;
  currentContestant?: string;
  franchises?: FranchiseStatus[];
  totalFranchises?: number;
  completedFranchises?: number;
  totalSeasons?: number;
  completedSeasons?: number;
  totalContestants?: number;
  completedContestants?: number;
}

interface EnhancedProgressProps {
  scrapingStatus: ScrapingStatusData;
}

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case 'running':
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    case 'failed':
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    case 'pending':
    default:
      return <Clock className="w-4 h-4 text-gray-400" />;
  }
};

const OverallProgress = ({ scrapingStatus }: EnhancedProgressProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Overall Progress</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">Status</span>
        <StatusBadge status={scrapingStatus.status} />
      </div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">Progress</span>
        <span className="font-medium">{(scrapingStatus.progress || 0).toFixed(1)}%</span>
      </div>
      <Progress value={scrapingStatus.progress || 0} />
    </CardContent>
  </Card>
);

const StatusBadge = ({ status }: { status: string }) => {
  const variants = {
    completed: "default",
    running: "secondary", 
    failed: "destructive",
    pending: "outline"
  } as const;

  return (
    <Badge variant={variants[status as keyof typeof variants] || "outline"}>
      {status}
    </Badge>
  );
};

// Donut chart component for visual progress
const DonutChart = ({ completed, total, label, color = "blue" }: { 
  completed: number; 
  total: number; 
  label: string;
  color?: string;
}) => {
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  const circumference = 2 * Math.PI * 45;
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
  
  const colorMap = {
    blue: "stroke-blue-500",
    green: "stroke-green-500",
    purple: "stroke-purple-500",
    orange: "stroke-orange-500"
  };

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-muted-foreground/20"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          className={colorMap[color as keyof typeof colorMap] || "stroke-blue-500"}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold">{completed}</span>
        <span className="text-xs text-muted-foreground">/{total}</span>
      </div>
    </div>
  );
};

export const EnhancedProgress = ({ scrapingStatus }: EnhancedProgressProps) => {
  const { level = 'full' } = scrapingStatus;
  if (scrapingStatus.status === "idle") {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            No active scraping operation
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full scrape view
  if (scrapingStatus.level === "full") {
    return (
      <div className="space-y-4">
        {/* Overall Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Franchises
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-center justify-between">
                <DonutChart 
                  completed={scrapingStatus.completedFranchises || 0}
                  total={scrapingStatus.totalFranchises || 0}
                  label="Franchises"
                  color="blue"
                />
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {scrapingStatus.completedFranchises || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    of {scrapingStatus.totalFranchises || 0} done
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <PieChart className="w-4 h-4" />
                Seasons
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-center justify-between">
                <DonutChart 
                  completed={scrapingStatus.completedSeasons || 0}
                  total={scrapingStatus.totalSeasons || 0}
                  label="Seasons"
                  color="green"
                />
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {scrapingStatus.completedSeasons || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    of {scrapingStatus.totalSeasons || 0} done
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Contestants
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-center justify-between">
                <DonutChart 
                  completed={scrapingStatus.completedContestants || 0}
                  total={scrapingStatus.totalContestants || 0}
                  label="Contestants"
                  color="purple"
                />
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {scrapingStatus.completedContestants || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    of {scrapingStatus.totalContestants || 0} done
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <StatusIcon status={scrapingStatus.status} />
                  <span className="font-medium">Full Scrape Progress</span>
                  <StatusBadge status={scrapingStatus.status} />
                </div>
                <span className="text-sm text-muted-foreground">
                  {scrapingStatus.progress.toFixed(1)}%
                </span>
              </div>
              <Progress value={scrapingStatus.progress} className="h-3" />
              
              {scrapingStatus.currentFranchise && (
                <div className="text-sm text-muted-foreground">
                  Currently processing: <span className="font-medium">{scrapingStatus.currentFranchise}</span>
                  {scrapingStatus.currentSeason && (
                    <> → <span className="font-medium">{scrapingStatus.currentSeason}</span></>
                  )}
                  {scrapingStatus.currentContestant && (
                    <> → <span className="font-medium">{scrapingStatus.currentContestant}</span></>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Franchise Progress List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Franchise Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scrapingStatus.franchises?.map((franchise) => (
                <div key={franchise.name} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <StatusIcon status={franchise.status} />
                      <span className="font-medium">{franchise.name}</span>
                      <StatusBadge status={franchise.status} />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {franchise.completedSeasons || 0}/{franchise.totalSeasons || 0} seasons
                    </div>
                  </div>
                  <Progress value={franchise.progress} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Season scrape view
  if (scrapingStatus.level === "season") {
    const currentSeason = scrapingStatus.franchises?.[0]?.seasons?.[0];
    
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Season Scraping Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <DonutChart 
                  completed={currentSeason?.completedContestants || 0}
                  total={currentSeason?.totalContestants || 0}
                  label="Contestants"
                  color="orange"
                />
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {currentSeason?.completedContestants || 0} of {currentSeason?.totalContestants || 0}
                </div>
                <div className="text-sm text-muted-foreground">contestants completed</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <StatusIcon status={scrapingStatus.status} />
                    <span className="font-medium">
                      {scrapingStatus.currentSeason || "Season"}
                    </span>
                    <StatusBadge status={scrapingStatus.status} />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {scrapingStatus.progress.toFixed(1)}%
                  </span>
                </div>
                <Progress value={scrapingStatus.progress} className="h-3" />
                
                {scrapingStatus.currentContestant && (
                  <div className="text-sm text-muted-foreground text-center">
                    Currently processing: <span className="font-medium">{scrapingStatus.currentContestant}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contestants Progress List */}
        {currentSeason?.contestants && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contestants Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {currentSeason.contestants.map((contestant) => (
                  <div key={contestant.name} className="flex items-center gap-2 p-2 border rounded">
                    <StatusIcon status={contestant.status} />
                    <span className="flex-1 text-sm">{contestant.name}</span>
                    <StatusBadge status={contestant.status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Contestant scrape view
  if (scrapingStatus.level === "contestant") {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Contestant Scraping
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold mb-2">
                  {scrapingStatus.currentContestant || "Contestant"}
                </div>
                <StatusBadge status={scrapingStatus.status} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {scrapingStatus.progress.toFixed(1)}%
                  </span>
                </div>
                <Progress value={scrapingStatus.progress} className="h-3" />
              </div>

              <div className="text-center text-sm text-muted-foreground">
                {scrapingStatus.status === "running" ? "Scraping contestant data..." : 
                 scrapingStatus.status === "completed" ? "Contestant data collected successfully" :
                 scrapingStatus.status === "failed" ? "Failed to collect contestant data" : "Ready to scrape"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Franchise scrape view
  if (scrapingStatus.level === "franchise") {
    return (
      <div className="space-y-4">
        {/* Franchise Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Seasons</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-center justify-between">
                <DonutChart 
                  completed={scrapingStatus.completedSeasons || 0}
                  total={scrapingStatus.totalSeasons || 0}
                  label="Seasons"
                  color="green"
                />
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {scrapingStatus.completedSeasons || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    of {scrapingStatus.totalSeasons || 0} done
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Contestants</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-center justify-between">
                <DonutChart 
                  completed={scrapingStatus.completedContestants || 0}
                  total={scrapingStatus.totalContestants || 0}
                  label="Contestants"
                  color="purple"
                />
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {scrapingStatus.completedContestants || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    of {scrapingStatus.totalContestants || 0} done
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {scrapingStatus.currentFranchise || "Franchise"} Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <StatusIcon status={scrapingStatus.status} />
                  <span className="font-medium">Franchise Scrape</span>
                  <StatusBadge status={scrapingStatus.status} />
                </div>
                <span className="text-sm text-muted-foreground">
                  {scrapingStatus.progress.toFixed(1)}%
                </span>
              </div>
              <Progress value={scrapingStatus.progress} className="h-3" />
              
              {scrapingStatus.currentSeason && (
                <div className="text-sm text-muted-foreground">
                  Currently processing: <span className="font-medium">{scrapingStatus.currentSeason}</span>
                  {scrapingStatus.currentContestant && (
                    <> → <span className="font-medium">{scrapingStatus.currentContestant}</span></>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Seasons Progress */}
        {scrapingStatus.franchises?.[0]?.seasons && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Seasons Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scrapingStatus.franchises[0].seasons.map((season) => (
                  <div key={season.name} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <StatusIcon status={season.status} />
                        <span className="font-medium">{season.name}</span>
                        <StatusBadge status={season.status} />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {season.completedContestants || 0}/{season.totalContestants || 0} contestants
                      </div>
                    </div>
                    <Progress value={season.progress} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Default fallback for unknown or general progress
  return <OverallProgress scrapingStatus={scrapingStatus} />;
}