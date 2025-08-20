import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Image, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


interface AppConfig {
  imageScraping: {
    enabled: boolean;
    downloadTimeout: number;
    maxFileSize: number;
    allowedFormats: string[];
  };
  scraping: {
    headless: boolean;
    timeout: number;
    retryAttempts: number;
  };
  storage: {
    s3Enabled: boolean;
    uploadTimeout: number;
  };
}

export function ConfigSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current configuration
  const { data: config, isLoading, error } = useQuery<AppConfig>({
    queryKey: ['/api/config'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Update image scraping setting
  const updateImageScrapingMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await fetch('/api/config/image-scraping', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/config'] });
      toast({
        title: "Settings Updated",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update image scraping setting",
        variant: "destructive",
      });
    },
  });

  // Reset configuration
  const resetConfigMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/config/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/config'] });
      toast({
        title: "Configuration Reset",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset configuration",
        variant: "destructive",
      });
    },
  });

  const handleImageScrapingToggle = (enabled: boolean) => {
    updateImageScrapingMutation.mutate(enabled);
  };

  const handleResetConfig = () => {
    if (confirm('Are you sure you want to reset all configuration to defaults?')) {
      resetConfigMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Application Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading configuration...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Application Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-destructive">Failed to load configuration</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Application Settings
        </CardTitle>
        <CardDescription>
          Configure scraping behavior and system preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Image Scraping Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                <Label htmlFor="image-scraping" className="text-sm font-medium">
                  Image Scraping
                </Label>
                <Badge variant={config?.imageScraping.enabled ? "default" : "secondary"}>
                  {config?.imageScraping.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Download contestant images during scraping operations
              </p>
            </div>
            <Switch
              id="image-scraping"
              checked={config?.imageScraping.enabled || false}
              onCheckedChange={handleImageScrapingToggle}
              disabled={updateImageScrapingMutation.isPending}
            />
          </div>

          {/* Image Scraping Details */}
          {config?.imageScraping.enabled && (
            <div className="ml-6 space-y-2 text-sm text-muted-foreground">
              <div>Max file size: {Math.round((config.imageScraping.maxFileSize || 0) / 1024 / 1024)}MB</div>
              <div>Timeout: {(config.imageScraping.downloadTimeout || 0) / 1000}s</div>
              <div>Formats: {config.imageScraping.allowedFormats?.join(", ")}</div>
            </div>
          )}
        </div>

        {/* S3 Storage Status */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">S3 Storage</Label>
            <Badge variant={config?.storage.s3Enabled ? "default" : "secondary"}>
              {config?.storage.s3Enabled ? "Available" : "Not Configured"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {config?.storage.s3Enabled 
              ? "Images will be uploaded to S3 storage" 
              : "S3 credentials not configured - images will be stored locally"
            }
          </p>
        </div>

        {/* Scraping Settings */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Scraping Configuration</Label>
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div>Mode: {config?.scraping.headless ? "Headless" : "Visible Browser"}</div>
            <div>Timeout: {(config?.scraping.timeout || 0) / 1000}s</div>
            <div>Retry attempts: {config?.scraping.retryAttempts}</div>
          </div>
        </div>

        {/* Reset Configuration */}
        <div className="pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetConfig}
            disabled={resetConfigMutation.isPending}
            className="w-full"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${resetConfigMutation.isPending ? 'animate-spin' : ''}`} />
            Reset to Defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}