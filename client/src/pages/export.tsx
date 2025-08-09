import { useQuery } from "@tanstack/react-query";
import { Download, FileText, Database, Calendar } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export default function Export() {
  const { toast } = useToast();

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: () => api.getStats(),
  });

  const { data: contestants = [] } = useQuery({
    queryKey: ["/api/contestants"],
    queryFn: () => api.getContestants(),
  });

  const handleExportCSV = () => {
    try {
      api.exportCSV();
      toast({
        title: "CSV Export Started",
        description: "Your CSV file download should begin shortly.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export CSV file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportJSON = () => {
    try {
      api.exportJSON();
      toast({
        title: "JSON Export Started",
        description: "Your JSON file download should begin shortly.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export JSON file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const franchiseCounts = contestants.reduce((counts, contestant) => {
    const franchise = contestant.franchise || "US";
    counts[franchise] = (counts[franchise] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full overflow-y-auto">
        <Header
          title="Export Data"
          subtitle="Download your scraped contestant data in various formats"
        />

        <div className="p-6 space-y-8 max-w-7xl mx-auto">
          {/* Export Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Database className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Records</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.contestants?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Seasons</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.seasons || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <FileText className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Last Updated</p>
                    <p className="text-sm font-bold text-gray-900">
                      {stats?.lastSync || "Never"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Export Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  CSV Export
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-sm">
                  Download contestant data as a CSV file for use in spreadsheet applications
                  like Excel, Google Sheets, or data analysis tools.
                </p>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Includes:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Drag names and real names</li>
                    <li>• Age, hometown, and season info</li>
                    <li>• Competition outcomes</li>
                    <li>• Biography and photo URLs</li>
                    <li>• Source URLs (Wikipedia, etc.)</li>
                  </ul>
                </div>

                <Button onClick={handleExportCSV} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  JSON Export
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-sm">
                  Download complete dataset as JSON for developers, APIs, or advanced
                  data processing and analysis applications.
                </p>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Includes:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Complete contestant records</li>
                    <li>• Season information</li>
                    <li>• Metadata (timestamps, IDs)</li>
                    <li>• Structured data format</li>
                    <li>• Export timestamp</li>
                  </ul>
                </div>

                <Button onClick={handleExportJSON} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download JSON
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Data Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Data Breakdown by Franchise</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(franchiseCounts).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No data available for export. Start scraping to populate the database.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(franchiseCounts).map(([franchise, count]) => (
                    <div key={franchise} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {franchise === "US" ? "RuPaul's Drag Race (US)" : `Drag Race ${franchise}`}
                        </h4>
                        <p className="text-sm text-gray-600">Contestants</p>
                      </div>
                      <Badge variant="secondary" className="text-lg">
                        {count}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export History */}
          <Card>
            <CardHeader>
              <CardTitle>Export Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">File Naming Convention</h4>
                  <p className="text-sm text-blue-800">
                    Files are named with the current date for easy organization:
                  </p>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1">
                    <li>• <code>drag_race_contestants_YYYY-MM-DD.csv</code></li>
                    <li>• <code>drag_race_data_YYYY-MM-DD.json</code></li>
                  </ul>
                </div>

                <div className="p-4 bg-amber-50 rounded-lg">
                  <h4 className="font-medium text-amber-900 mb-2">Usage Tips</h4>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• CSV files work best for basic analysis and viewing</li>
                    <li>• JSON files preserve all data structure and relationships</li>
                    <li>• Both formats include complete contestant information</li>
                    <li>• Exports reflect the current state of your database</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
