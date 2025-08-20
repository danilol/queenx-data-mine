import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Trash2, Settings, Download, Bug, Upload, TestTube, Play, Square, Monitor, Globe, Calendar, Users } from "lucide-react";
import { Header } from "@/components/layout/header";
import { StatsCards } from "@/components/stats-cards";
import { ScrapingProgress } from "@/components/scraping-progress";
import { ConfigSettings } from "@/components/config-settings";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { api } from "@/lib/api";
import { Link } from "wouter";

export default function Dashboard() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [headlessMode, setHeadlessMode] = useState(true);
  const [screenshotsEnabled, setScreenshotsEnabled] = useState(true);
  const [selectedScrapingLevel, setSelectedScrapingLevel] = useState<'full' | 'franchise' | 'season' | 'contestant'>('full');
  const [customSourceUrl, setCustomSourceUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isConnected } = useWebSocket();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: () => api.getStats(),
  });

  const { data: scrapingStatus } = useQuery({
    queryKey: ["/api/scraping/status"],
    queryFn: () => api.getScrapingStatus(),
    refetchInterval: 5000,
  });

  const { data: scrapingJobs = [] } = useQuery({
    queryKey: ["/api/scraping/jobs"],
    queryFn: () => api.getScrapingJobs(),
  });

  // Scraping mutations
  const startScrapingMutation = useMutation({
    mutationFn: () => api.startScraping({ 
      headless: headlessMode, 
      screenshotsEnabled,
      level: selectedScrapingLevel,
      sourceUrl: customSourceUrl || undefined
    }),
    onSuccess: () => {
      toast({
        title: "Scraping Started",
        description: `${selectedScrapingLevel.charAt(0).toUpperCase() + selectedScrapingLevel.slice(1)} scraping has begun. Monitor progress below.`,
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

  // S3 upload mutations
  const uploadFileMutation = useMutation({
    mutationFn: (file: File) => api.uploadFileToS3(file),
    onSuccess: (data) => {
      toast({
        title: "File Uploaded Successfully",
        description: `${data.fileName} uploaded to S3. Size: ${(data.size / 1024).toFixed(1)}KB`,
      });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    },
  });

  const testS3Mutation = useMutation({
    mutationFn: () => api.testS3Connection(),
    onSuccess: (data) => {
      toast({
        title: "S3 Connection Test Successful",
        description: `Connected to bucket: ${data.bucket}. Region: ${data.region}`,
      });
    },
    onError: (error) => {
      toast({
        title: "S3 Connection Test Failed",
        description: error instanceof Error ? error.message : "Failed to connect to S3",
        variant: "destructive",
      });
    },
  });

  // Database reset mutation (DEV only)
  const databaseResetMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/database/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reset database');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries();
      toast({
        title: "Database Reset Complete",
        description: `All data has been cleared. ${data.tablesCleared.length} tables reset.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Database Reset Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadFileMutation.mutate(selectedFile);
    }
  };

  const handleDatabaseReset = async () => {
    const confirmed = window.confirm(
      "⚠️ This will permanently delete ALL data in the database including contestants, seasons, franchises, and scraping jobs. This action cannot be undone. Are you sure?"
    );
    if (confirmed) {
      databaseResetMutation.mutate();
    }
  };

  const handleStartScraping = () => {
    startScrapingMutation.mutate();
  };

  const handleStopScraping = () => {
    stopScrapingMutation.mutate();
  };

  const isScrapingActive = scrapingStatus && 'status' in scrapingStatus && scrapingStatus.status === 'running';

  const getScrapingButtonText = () => {
    switch (selectedScrapingLevel) {
      case 'full': return 'Start Full Scraping';
      case 'franchise': return 'Scrape Franchise';
      case 'season': return 'Scrape Season';
      case 'contestant': return 'Scrape Contestant';
      default: return 'Start Scraping';
    }
  };

  const getScrapingDescription = () => {
    switch (selectedScrapingLevel) {
      case 'full': return 'Complete scraping of all RuPaul\'s Drag Race data from Wikipedia';
      case 'franchise': return 'Scrape specific franchise data and its seasons';
      case 'season': return 'Scrape specific season data and its contestants';
      case 'contestant': return 'Scrape specific contestant data';
      default: return 'Select scraping level';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="relative">
        <Header 
          title="Drag Race Data Manager"
          subtitle="Monitor scraping progress and manage contestant data"
          showScrapingButtons={false}
        />

        <div className="p-6 space-y-8 max-w-7xl mx-auto">
          {/* Scraping Controls - New Priority Section */}
          <Card className="border-2 border-primary/30 bg-gradient-to-r from-background to-primary/10">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                Scraping Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Scraping Level Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="scraping-level" className="text-sm font-medium">Scraping Level</Label>
                    <Select value={selectedScrapingLevel} onValueChange={(value: any) => setSelectedScrapingLevel(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select scraping level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Scraping</SelectItem>
                        <SelectItem value="franchise">Franchise Level</SelectItem>
                        <SelectItem value="season">Season Level</SelectItem>
                        <SelectItem value="contestant">Contestant Level</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">{getScrapingDescription()}</p>
                  </div>

                  {(selectedScrapingLevel === 'franchise' || selectedScrapingLevel === 'season' || selectedScrapingLevel === 'contestant') && (
                    <div className="space-y-2">
                      <Label htmlFor="source-url" className="text-sm font-medium">Source URL (Optional)</Label>
                      <Input
                        id="source-url"
                        value={customSourceUrl}
                        onChange={(e) => setCustomSourceUrl(e.target.value)}
                        placeholder="https://en.wikipedia.org/wiki/..."
                        className="text-sm"
                      />
                      <p className="text-xs text-muted-foreground">Leave empty to use default Wikipedia URLs</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="headless-mode" className="text-sm font-medium">Headless Mode</Label>
                      <Switch
                        id="headless-mode"
                        checked={headlessMode}
                        onCheckedChange={setHeadlessMode}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="screenshots" className="text-sm font-medium">Screenshots</Label>
                      <Switch
                        id="screenshots"
                        checked={screenshotsEnabled}
                        onCheckedChange={setScreenshotsEnabled}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">WebSocket</span>
                      <Badge variant={isConnected ? "default" : "destructive"}>
                        {isConnected ? "Connected" : "Disconnected"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant={isScrapingActive ? "default" : "outline"}>
                        {isScrapingActive ? "Running" : "Idle"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex gap-4 pt-4 border-t border-border">
                <Button
                  onClick={handleStartScraping}
                  disabled={startScrapingMutation.isPending || isScrapingActive}
                  className="flex items-center gap-2 flex-1 md:flex-none"
                >
                  <Play className="h-4 w-4" />
                  {startScrapingMutation.isPending ? "Starting..." : getScrapingButtonText()}
                </Button>
                
                <Button
                  onClick={handleStopScraping}
                  disabled={stopScrapingMutation.isPending || !isScrapingActive}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Square className="h-4 w-4" />
                  {stopScrapingMutation.isPending ? "Stopping..." : "Stop"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Scraping Progress - Priority Section */}
          <ScrapingProgress />

          {/* Stats Cards */}
          <StatsCards stats={stats} isLoading={statsLoading} />

          {/* Configuration Settings */}
          <ConfigSettings />

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="card-enhanced hover:scale-105 transition-transform duration-200">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl mr-3 shadow-lg">
                    <Settings className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-foreground">Manage Data</h4>
                </div>
                <p className="text-muted-foreground text-sm mb-4">View and edit franchises, seasons, and contestants</p>
                <div className="space-y-2">
                  <Link href="/manage/franchises">
                    <Button variant="outline" className="w-full text-sm">Franchises</Button>
                  </Link>
                  <Link href="/manage/seasons">
                    <Button variant="outline" className="w-full text-sm">Seasons</Button>
                  </Link>
                  <Link href="/manage/contestants">
                    <Button variant="outline" className="w-full text-sm">Contestants</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="card-enhanced hover:scale-105 transition-transform duration-200">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl mr-3 shadow-lg">
                    <Download className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-foreground">Export Data</h4>
                </div>
                <p className="text-muted-foreground text-sm mb-4">Download your data in CSV or JSON format</p>
                <Link href="/export">
                  <div className="w-full">
                    <Button variant="outline" className="w-full hover:bg-primary hover:text-primary-foreground transition-colors">
                      Export Now
                    </Button>
                  </div>
                </Link>
              </CardContent>
            </Card>

            <Card className="card-enhanced hover:scale-105 transition-transform duration-200">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl mr-3 shadow-lg">
                    <Bug className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-foreground">Debug Mode</h4>
                </div>
                <p className="text-muted-foreground text-sm mb-4">Enable visual debugging for scraping process</p>
                <Badge variant={!headlessMode ? "default" : "outline"} className="w-full justify-center">
                  {!headlessMode ? "Enabled" : "Disabled"}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* S3 Upload Testing Section */}
          <Card className="card-enhanced">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">S3 Upload Testing</h3>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={() => testS3Mutation.mutate()}
                    disabled={testS3Mutation.isPending}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <TestTube className="h-4 w-4" />
                    {testS3Mutation.isPending ? "Testing..." : "Test S3 Connection"}
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Select File
                    </Button>
                    
                    {selectedFile && (
                      <Button
                        onClick={handleUpload}
                        disabled={uploadFileMutation.isPending}
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        {uploadFileMutation.isPending ? "Uploading..." : "Upload to S3"}
                      </Button>
                    )}
                  </div>
                </div>
                
                {selectedFile && (
                  <div className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)}KB)
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Job History */}
          {scrapingJobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Scraping History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {scrapingJobs.slice(0, 10).map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={
                            job.status === 'completed' ? 'default' : 
                            job.status === 'failed' ? 'destructive' : 
                            job.status === 'running' ? 'secondary' : 'outline'
                          }>
                            {job.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {job.startedAt ? new Date(job.startedAt).toLocaleString() : 'Not started'}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {job.totalItems ? `${job.totalItems} items` : 'Unknown'}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Development Tools Section - Moved to Bottom */}
          {process.env.NODE_ENV === 'development' && (
            <Card className="card-enhanced border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-4 flex items-center gap-2">
                  <Bug className="h-5 w-5" />
                  Development Tools
                </h3>
                <div className="space-y-4">
                  <div className="bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg p-4">
                    <p className="text-red-800 dark:text-red-200 text-sm mb-3">
                      ⚠️ <strong>Danger Zone:</strong> These tools are only available in development mode.
                    </p>
                    <Button
                      onClick={handleDatabaseReset}
                      disabled={databaseResetMutation.isPending}
                      variant="destructive"
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      {databaseResetMutation.isPending ? "Resetting Database..." : "Reset Database"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}