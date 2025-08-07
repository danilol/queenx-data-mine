import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, AlertCircle, Play } from "lucide-react";
import { ScrapingProgress as ScrapingProgressType, seasonStatusSchema } from "@shared/schema";
import { z } from "zod";
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
  const getApiStatus = (): ScrapingProgressType => {
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
    return { ...defaultStatus, status: (scrapingStatus?.status as 'idle' | 'running' | 'completed' | 'failed') || 'idle' };
  };

  const currentStatus: ScrapingProgressType = scrapingProgress || getApiStatus();
  const isActive = currentStatus.status === 'running';
  const isCompleted = currentStatus.status === 'completed';
  const isFailed = currentStatus.status === 'failed';
  
  const getStatusBadge = () => {
    if (isActive) {
      return (
        <Badge className="bg-blue-100 text-blue-800">
          <Play className="h-3 w-3 mr-1" />
          Running
        </Badge>
      );
    }
    if (isCompleted) {
      return (
        <Badge className="bg-emerald-100 text-emerald-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    }
    if (isFailed) {
      return (
        <Badge className="bg-red-100 text-red-800">
          <AlertCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-100 text-gray-800">
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

  return (
    <Card className="border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Current Scraping Progress</h3>
          {getStatusBadge()}
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Overall Progress</span>
            <span className="font-semibold text-gray-900">
              {getCurrentItem() || "Ready to start"}
            </span>
          </div>
          
          <Progress value={progress || 0} className="h-2" />
          
          <div className="text-right text-sm text-gray-600">
            {(progress || 0)}% complete
          </div>

          {scrapingProgress?.screenshot && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Live Screenshot</h4>
              <img
                src={scrapingProgress.screenshot}
                alt="Current scraping screenshot"
                className="w-full max-w-md rounded-lg border border-gray-200 screenshot-fade-in"
              />
            </div>
          )}
          

        </div>
      </CardContent>
    </Card>
  );
}
