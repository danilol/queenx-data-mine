import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Play, Square, Bug, Settings, Monitor } from "lucide-react";
import { Header } from "@/components/layout/header";
import { ScrapingProgress } from "@/components/scraping-progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { api } from "@/lib/api";

export default function Scraper() {
  const [headlessMode, setHeadlessMode] = useState(true);
  const [screenshotsEnabled, setScreenshotsEnabled] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isConnected } = useWebSocket();

  const { data: scrapingStatus } = useQuery({
    queryKey: ["/api/scraping/status"],
    queryFn: () => api.getScrapingStatus(),
    refetchInterval: 5000,
  });

  const { data: scrapingJobs = [] } = useQuery({
    queryKey: ["/api/scraping/jobs"],
    queryFn: () => api.getScrapingJobs(),
  });

  const startScrapingMutation = useMutation({
    mutationFn: () => api.startScraping({ headless: headlessMode, screenshotsEnabled }),
    onSuccess: () => {
      toast({
        title: "Scraping Started",
        description: "Web scraping has begun. Monitor progress below.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/scraping/status"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Start Scraping",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const stopScrapingMutation = useMutation({
    mutationFn: () => api.stopScraping(),
    onSuccess: () => {
      toast({
        title: "Scraping Stopped",
        description: "The scraping process has been stopped.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/scraping/status"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Stop Scraping",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const isRunning = scrapingStatus && 'status' in scrapingStatus && scrapingStatus.status === 'running';

  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full overflow-y-auto">
        <Header
          title="Web Scraper"
          subtitle="Configure and monitor your data scraping operations"
        />

        <div className="p-6 space-y-6">
          {/* Demo Mode Notice */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Monitor className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-1">Demo Mode Active</h3>
                  <p className="text-sm text-blue-700 mb-2">
                    Currently using sample data to demonstrate functionality. The scraper simulates collecting 
                    RuPaul's Drag Race contestant information with real-time progress tracking.
                  </p>
                  <p className="text-xs text-blue-600">
                    For production use with real Playwright browser automation, system dependencies would need to be installed.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* WebSocket Status */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm text-gray-600">
                    Real-time Connection: {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
                  {isConnected ? "Live" : "Offline"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Scraper Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Scraper Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="headless">Headless Mode</Label>
                      <p className="text-sm text-gray-500">
                        Run browser in background without visual interface
                      </p>
                    </div>
                    <Switch
                      id="headless"
                      checked={headlessMode}
                      onCheckedChange={setHeadlessMode}
                      disabled={isRunning}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="screenshots">Screenshots Enabled</Label>
                      <p className="text-sm text-gray-500">
                        Capture screenshots during scraping for debugging
                      </p>
                    </div>
                    <Switch
                      id="screenshots"
                      checked={screenshotsEnabled}
                      onCheckedChange={setScreenshotsEnabled}
                      disabled={isRunning}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex space-x-3">
                    <Button
                      onClick={() => startScrapingMutation.mutate()}
                      disabled={startScrapingMutation.isPending || isRunning}
                      className="flex-1"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {startScrapingMutation.isPending ? "Starting..." : "Start Demo Scraping"}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => stopScrapingMutation.mutate()}
                      disabled={stopScrapingMutation.isPending || !isRunning}
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Stop
                    </Button>
                  </div>
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Data Sources:</strong></p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Wikipedia (Primary)</li>
                    <li>RuPaul's Drag Race Fandom Wiki</li>
                    <li>Official franchise websites (Future)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Monitor className="h-5 w-5 mr-2" />
                  Debug Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <Bug className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-blue-800">Visual Debug Mode</span>
                    </div>
                    <Badge variant={headlessMode ? "outline" : "default"}>
                      {headlessMode ? "Disabled" : "Enabled"}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Current Status:</h4>
                    <div className="text-sm text-gray-600">
                      {scrapingStatus && 'status' in scrapingStatus ? (
                        <Badge variant={scrapingStatus.status === 'running' ? 'default' : 'outline'}>
                          {scrapingStatus.status}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Idle</Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Features:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>✓ Real-time progress tracking</li>
                      <li>✓ Screenshot capture</li>
                      <li>✓ Error handling & recovery</li>
                      <li>✓ Incremental data updates</li>
                      <li>✓ Duplicate detection</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Scraping Progress */}
          <ScrapingProgress />

          {/* Job History */}
          <Card>
            <CardHeader>
              <CardTitle>Scraping History</CardTitle>
            </CardHeader>
            <CardContent>
              {scrapingJobs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No scraping jobs found. Start your first scraping session above.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scrapingJobs.slice(0, 10).map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={
                            job.status === 'completed' ? 'default' : 
                            job.status === 'failed' ? 'destructive' : 
                            job.status === 'running' ? 'secondary' : 'outline'
                          }>
                            {job.status}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {job.startedAt ? new Date(job.startedAt).toLocaleString() : 'Not started'}
                          </span>
                        </div>
                        {job.errorMessage && (
                          <p className="text-sm text-red-600 mt-1">{job.errorMessage}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {job.progress || 0}% Complete
                        </div>
                        {job.totalItems && (
                          <div className="text-xs text-gray-500">
                            {job.totalItems} total items
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
