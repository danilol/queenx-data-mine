import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Trash2, Settings, Download, Bug, Upload, TestTube } from "lucide-react";
import { useState, useRef } from "react";
import { Header } from "@/components/layout/header";
import { StatsCards } from "@/components/stats-cards";
import { ScrapingProgress } from "@/components/scraping-progress";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { FullContestant, Contestant } from "@shared/schema";
import { Link } from "wouter";

export default function Dashboard() {

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: () => api.getStats(),
  });

  const { data: recentContestantsData = [] } = useQuery<FullContestant[]>({
    queryKey: ["/api/contestants", "recent"],
    queryFn: () => api.getContestants(undefined, 10),
  });

  const recentContestants = recentContestantsData.filter((c: FullContestant, i: number, arr: FullContestant[]) => arr.findIndex(c2 => c2.id === c.id) === i);



  const handleDeleteContestant = async (contestant: Contestant) => {
    if (window.confirm(`Are you sure you want to delete ${contestant.dragName}?`)) {
      try {
        await api.deleteContestant(contestant.id);
        toast({
          title: "Contestant Deleted",
          description: `${contestant.dragName} has been removed from the database.`,
        });
      } catch (error) {
        toast({
          title: "Delete Failed",
          description: error instanceof Error ? error.message : "Failed to delete contestant",
          variant: "destructive",
        });
      }
    }
  };

  const getOutcomeVariant = (outcome: string | undefined) => {
    if (!outcome) return "outline";
    const lower = outcome.toLowerCase();
    if (lower.includes("winner")) return "default";
    if (lower.includes("runner-up")) return "secondary";
    return "outline";
  };

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
      // Invalidate all queries to refresh the UI
      queryClient.invalidateQueries();
      toast({
        title: "Database Reset Complete",
        description: `All data has been cleared. ${data.tablesCleared.length} tables reset.`,
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Database Reset Failed",
        description: error instanceof Error ? error.message : "Failed to reset database",
        variant: "destructive",
      });
    },
  });

  const handleDatabaseReset = () => {
    const confirmed = window.confirm(
      "⚠️ ARE YOU SURE?\n\n" +
      "This will permanently delete ALL data from the database:\n" +
      "• All contestants\n" +
      "• All seasons\n" +
      "• All franchises\n" +
      "• All appearances\n" +
      "• All scraping jobs\n\n" +
      "This action cannot be undone!"
    );

    if (confirmed) {
      const doubleConfirm = window.confirm(
        "🚨 FINAL WARNING!\n\n" +
        "You are about to erase the entire database.\n" +
        "Click OK only if you're absolutely certain."
      );
      
      if (doubleConfirm) {
        databaseResetMutation.mutate();
      }
    }
  };

  const testS3Mutation = useMutation({
    mutationFn: () => api.testS3Connection(),
    onSuccess: (data) => {
      toast({
        title: "S3 Connection Test Successful",
        description: `Test file uploaded successfully. Key: ${data.key}`,
      });
    },
    onError: (error) => {
      toast({
        title: "S3 Connection Test Failed",
        description: error instanceof Error ? error.message : "Failed to test S3 connection",
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

  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full overflow-y-auto">
        <Header
          title="Dashboard"
          subtitle="Monitor your scraping progress and manage contestant data"
          showScrapingButtons={true}
        />

        <div className="p-6 space-y-8 max-w-7xl mx-auto">
          {/* Development Tools Section */}
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

          {/* Stats Cards */}
          <StatsCards stats={stats} isLoading={statsLoading} />

          {/* Scraping Progress */}
          <ScrapingProgress />

          {/* Recent Contestants */}
          <Card className="card-enhanced">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-foreground">Recently Added Contestants</h3>
                <Link href="/contestants">
                  <span className="text-primary hover:text-primary/80 font-medium text-sm cursor-pointer transition-colors">
                    View All →
                  </span>
                </Link>
              </div>

              {recentContestants.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No contestants found. Start scraping to populate the database.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 font-medium text-muted-foreground text-sm">Photo</th>
                        <th className="text-left py-3 px-2 font-medium text-muted-foreground text-sm">Drag Name</th>
                        <th className="text-left py-3 px-2 font-medium text-muted-foreground text-sm">Real Name</th>
                        <th className="text-left py-3 px-2 font-medium text-muted-foreground text-sm">Season</th>
                        <th className="text-left py-3 px-2 font-medium text-muted-foreground text-sm">Hometown</th>
                        <th className="text-left py-3 px-2 font-medium text-muted-foreground text-sm">Outcome</th>
                        <th className="text-left py-3 px-2 font-medium text-muted-foreground text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted/50">
                      {recentContestants.map((contestant) => (
                        <tr key={contestant.id} className="border-b hover:bg-muted/50">
                          <td className="py-4 px-2">
                            <div className="w-12 h-12 bg-muted/50 rounded-lg flex items-center justify-center">
                              <span className="text-muted-foreground text-xs">No Photo</span>
                            </div>
                          </td>
                          <td className="py-4 px-2">
                            <div className="font-medium text-foreground">{contestant.dragName}</div>
                          </td>
                          <td className="py-4 px-2 text-muted-foreground">{contestant.realName || "—"}</td>
                          <td className="py-4 px-2">
                            <Badge variant="secondary">{contestant.season}</Badge>
                          </td>
                          <td className="py-4 px-2 text-muted-foreground">{contestant.hometown || "—"}</td>
                          <td className="py-4 px-2">
                            {contestant.outcome ? (
                              <Badge variant={getOutcomeVariant(contestant.outcome)}>
                                {contestant.outcome}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-4 px-2">
                            <div className="flex space-x-2">
                              <Link href={`/manage/contestants/${contestant.id}`}>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteContestant(contestant)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="card-enhanced hover:scale-105 transition-transform duration-200">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl mr-3 shadow-lg">
                    <Settings className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-foreground">Scraper Settings</h4>
                </div>
                <p className="text-muted-foreground text-sm mb-4">Configure scraping parameters and data sources</p>
                <Link href="/scraper">
                  <div className="w-full">
                    <Button variant="outline" className="w-full hover:bg-primary hover:text-primary-foreground transition-colors">
                      Open Settings
                    </Button>
                  </div>
                </Link>
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
                <Button variant="outline" className="w-full hover:bg-primary hover:text-primary-foreground transition-colors">
                  Enable Debug
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>


    </div>
  );
}
