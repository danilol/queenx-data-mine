import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";

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
}

interface FranchiseStatus {
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  seasons?: SeasonStatus[];
}

interface HierarchicalProgressProps {
  franchises?: FranchiseStatus[];
  overallProgress: number;
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

export function HierarchicalProgress({ franchises = [], overallProgress }: HierarchicalProgressProps) {
  if (!franchises.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            No franchise data available for hierarchical progress display
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalFranchises = franchises.length;
  const completedFranchises = franchises.filter(f => f.status === 'completed').length;

  return (
    <div className="space-y-4">
      {/* Overall Progress Header */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Full Scrape Progress</h3>
              <span className="text-sm text-muted-foreground">
                {completedFranchises}/{totalFranchises} franchises completed
              </span>
            </div>
            <Progress value={overallProgress} className="h-2" />
            <div className="text-center text-sm text-muted-foreground">
              {overallProgress.toFixed(1)}% Complete
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Franchise Details */}
      <div className="space-y-3">
        {franchises.map((franchise, franchiseIndex) => (
          <Card key={franchise.name} className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Franchise Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={franchise.status} />
                    <h4 className="font-medium">{franchise.name}</h4>
                    <StatusBadge status={franchise.status} />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {franchise.progress.toFixed(0)}%
                  </span>
                </div>
                
                <Progress value={franchise.progress} className="h-2" />

                {/* Seasons */}
                {franchise.seasons && franchise.seasons.length > 0 && (
                  <div className="ml-6 space-y-2">
                    {franchise.seasons.map((season, seasonIndex) => (
                      <div key={season.name} className="border-l-2 border-l-gray-200 pl-4 py-2">
                        <div className="space-y-2">
                          {/* Season Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <StatusIcon status={season.status} />
                              <span className="text-sm font-medium">{season.name}</span>
                              <StatusBadge status={season.status} />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {season.progress.toFixed(0)}%
                            </span>
                          </div>
                          
                          <Progress value={season.progress} className="h-1" />

                          {/* Contestants */}
                          {season.contestants && season.contestants.length > 0 && (
                            <div className="ml-4 space-y-1">
                              {season.contestants.map((contestant, contestantIndex) => (
                                <div key={contestant.name} className="flex items-center gap-2 text-xs">
                                  <StatusIcon status={contestant.status} />
                                  <span className="text-muted-foreground">{contestant.name}</span>
                                  <StatusBadge status={contestant.status} />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}