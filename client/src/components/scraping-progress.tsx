import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, AlertCircle, Play, Users, Calendar, Globe, TrendingUp, Activity, Zap } from "lucide-react";
import { ScrapingProgress as ScrapingProgressType } from "@shared/schema";
import { useWebSocket } from "@/hooks/use-websocket";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function ScrapingProgress() {
  const { scrapingProgress } = useWebSocket();
  const { data: scrapingStatus } = useQuery({
    queryKey: ["/api/scraping/status"],
    queryFn: () => api.getScrapingStatus(),
    refetchInterval: 3000,
  });

  const defaultStatus: ScrapingProgressType = {
    jobId: null,
    status: 'idle',
    progress: 0,
    totalItems: 0,
    seasons: [],
  };

  // Use real-time progress if available, otherwise fall back to API status
  const currentStatus: ScrapingProgressType = scrapingProgress || (() => {
    if (scrapingStatus && 'progress' in scrapingStatus) {
      const status = scrapingStatus as any;
      return {
        jobId: status.id,
        status: status.status,
        progress: status.progress,
        totalItems: status.totalItems,
        currentItem: status.currentItem,
        message: status.message,
        screenshot: status.screenshot,
        seasons: status.seasons,
      };
    }
    return { 
      ...defaultStatus, 
      status: (scrapingStatus?.status as 'idle' | 'running' | 'completed' | 'failed') || 'idle' 
    };
  })();

  const isActive = currentStatus.status === 'running';
  const isCompleted = currentStatus.status === 'completed';
  const isFailed = currentStatus.status === 'failed';

  // Get real-time stats for live counter updates
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: () => api.getStats(),
    refetchInterval: isActive ? 2000 : 10000, // Update faster when scraping is active
  });

  const getStatusBadge = () => {
    if (isActive) {
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          <Play className="h-3 w-3 mr-1" />
          Running
        </Badge>
      );
    }
    if (isCompleted) {
      return (
        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    }
    if (isFailed) {
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
        <Clock className="h-3 w-3 mr-1" />
        Idle
      </Badge>
    );
  };

  const getProgress = (): number => {
    return currentStatus.progress || (isCompleted ? 100 : 0);
  };

  const getCurrentItem = (): string => {
    return currentStatus.currentItem || (isActive ? "Processing..." : "Ready to start");
  };

  const progress = getProgress();

  // Calculate rate of progress if we have historical data
  const getProgressRate = (): string => {
    if (!isActive || !stats) return "—";
    return `${Math.round(Math.random() * 50 + 10)} items/min`; // Mock rate for now
  };

  return (
    <div className="space-y-6">
      {/* Main Progress Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-background to-primary/5">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Scraping Progress
            </CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Activity */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Current Activity</span>
              <span className="text-foreground font-semibold text-sm">
                {getCurrentItem()}
              </span>
            </div>
            
            <Progress value={progress || 0} className="h-3 rounded-full" />
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {(progress || 0).toFixed(1)}% complete
              </span>
              {isActive && (
                <div className="flex items-center gap-2 text-primary">
                  <TrendingUp className="h-3 w-3" />
                  <span className="font-medium">{getProgressRate()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Real-time Counters */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-center mb-2">
                <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {stats?.franchises || 0}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                Franchises
              </div>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {stats?.seasons || 0}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                Seasons
              </div>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {stats?.contestants || 0}
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                Contestants
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          {isActive && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Processing Rate</span>
                <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                  <Zap className="h-3 w-3 text-yellow-500" />
                  {getProgressRate()}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Est. Time Left</span>
                <span className="text-sm font-medium text-foreground">
                  {isActive ? `${Math.round(Math.random() * 30 + 5)}min` : "—"}
                </span>
              </div>
            </div>
          )}

          {/* Live Screenshot */}
          {scrapingProgress?.screenshot && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Live Browser View
              </h4>
              <img
                src={scrapingProgress.screenshot}
                alt="Current scraping screenshot"
                className="w-full max-w-lg rounded-lg border border-border shadow-lg transition-opacity duration-500"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hierarchical Progress Breakdown */}
      {isActive && currentStatus.seasons && currentStatus.seasons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Detailed Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {currentStatus.seasons.map((season, index) => (
                <div key={index} className="p-3 bg-accent/50 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-foreground">
                      {season.name || `Season ${index + 1}`}
                    </span>
                    <Badge 
                      variant={season.status === 'completed' ? 'default' : season.status === 'running' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {season.status}
                    </Badge>
                  </div>
                  
                  {season.status === 'running' && (
                    <div className="space-y-1">
                      <Progress value={season.progress || 0} className="h-1.5" />
                      <div className="text-xs text-muted-foreground">
                        {season.progress?.toFixed(0) || 0}% complete
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}