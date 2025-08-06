import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, AlertCircle, Play } from "lucide-react";
import { ScrapingProgress as ScrapingProgressType } from "@shared/schema";
import { useWebSocket } from "@/hooks/use-websocket";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function ScrapingProgress() {
  const { scrapingProgress } = useWebSocket();
  const { data: scrapingStatus } = useQuery({
    queryKey: ["/api/scraping/status"],
    queryFn: () => api.getScrapingStatus(),
    refetchInterval: 5000,
  });

  // Use real-time progress if available, otherwise fall back to API status
  const currentStatus = scrapingProgress || scrapingStatus;
  const isActive = currentStatus && 'status' in currentStatus && currentStatus.status === 'running';
  const isCompleted = currentStatus && 'status' in currentStatus && currentStatus.status === 'completed';
  const isFailed = currentStatus && 'status' in currentStatus && currentStatus.status === 'failed';
  
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
    if (scrapingProgress) {
      return scrapingProgress.progress || 0;
    }
    if (currentStatus && 'progress' in currentStatus) {
      return currentStatus.progress || 0;
    }
    return isCompleted ? 100 : 0;
  };

  const getCurrentItem = (): string => {
    if (scrapingProgress) {
      return scrapingProgress.currentItem || "Initializing...";
    }
    if (currentStatus && 'currentItem' in currentStatus) {
      return currentStatus.currentItem || "Processing...";
    }
    return "Ready to start";
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Data Sources Status</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Wikipedia</span>
                  <Badge variant={isActive ? "secondary" : isCompleted ? "default" : "outline"} className="text-xs">
                    {isActive ? "Active" : isCompleted ? "Complete" : "Pending"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Fandom Wiki</span>
                  <Badge variant="outline" className="text-xs">Pending</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Official Website</span>
                  <Badge variant="outline" className="text-xs">Pending</Badge>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Recent Activity</h4>
              <div className="space-y-2 text-sm text-gray-600">
                {scrapingProgress?.message && (
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-emerald-500 mr-2" />
                    {scrapingProgress.message}
                  </div>
                )}
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mr-2" />
                  System initialized
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mr-2" />
                  Ready to scrape data
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
