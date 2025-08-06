import { useQuery } from "@tanstack/react-query";
import { Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { Header } from "@/components/layout/header";
import { StatsCards } from "@/components/stats-cards";
import { ScrapingProgress } from "@/components/scraping-progress";
import { ContestantEditModal } from "@/components/contestant-edit-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { type Contestant } from "@shared/schema";
import { Link } from "wouter";

export default function Dashboard() {
  const [selectedContestant, setSelectedContestant] = useState<Contestant | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: () => api.getStats(),
  });

  const { data: recentContestants = [] } = useQuery({
    queryKey: ["/api/contestants", "recent"],
    queryFn: () => api.getContestants(undefined, 10),
  });

  const handleEditContestant = (contestant: Contestant) => {
    setSelectedContestant(contestant);
    setIsEditModalOpen(true);
  };

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

  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full overflow-y-auto">
        <Header
          title="Dashboard"
          subtitle="Monitor your scraping progress and manage contestant data"
          showScrapingButtons={true}
        />

        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <StatsCards stats={stats} isLoading={statsLoading} />

          {/* Scraping Progress */}
          <ScrapingProgress />

          {/* Recent Contestants */}
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recently Added Contestants</h3>
                <Link href="/contestants">
                  <span className="text-blue-600 hover:text-blue-700 font-medium text-sm cursor-pointer">
                    View All →
                  </span>
                </Link>
              </div>

              {recentContestants.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No contestants found. Start scraping to populate the database.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Photo</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Drag Name</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Real Name</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Season</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Hometown</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Outcome</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {recentContestants.map((contestant) => (
                        <tr key={contestant.id} className="hover:bg-gray-50">
                          <td className="py-4 px-2">
                            {contestant.photoUrl ? (
                              <img
                                src={contestant.photoUrl}
                                alt={contestant.dragName}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                <span className="text-gray-400 text-xs">No Photo</span>
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-2">
                            <div className="font-semibold text-gray-900">{contestant.dragName}</div>
                          </td>
                          <td className="py-4 px-2 text-gray-600">{contestant.realName || "—"}</td>
                          <td className="py-4 px-2">
                            <Badge variant="secondary">{contestant.season}</Badge>
                          </td>
                          <td className="py-4 px-2 text-gray-600">{contestant.hometown || "—"}</td>
                          <td className="py-4 px-2">
                            {contestant.outcome ? (
                              <Badge variant={getOutcomeVariant(contestant.outcome)}>
                                {contestant.outcome}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="py-4 px-2">
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditContestant(contestant)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteContestant(contestant)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
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
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <i className="fas fa-spider text-blue-600"></i>
                  </div>
                  <h4 className="font-semibold text-gray-900">Scraper Settings</h4>
                </div>
                <p className="text-gray-600 text-sm mb-4">Configure scraping parameters and data sources</p>
                <Link href="/scraper">
                  <div className="w-full">
                    <Button variant="outline" className="w-full">
                      Open Settings
                    </Button>
                  </div>
                </Link>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-emerald-100 rounded-lg mr-3">
                    <i className="fas fa-download text-emerald-600"></i>
                  </div>
                  <h4 className="font-semibold text-gray-900">Export Data</h4>
                </div>
                <p className="text-gray-600 text-sm mb-4">Download your data in CSV or JSON format</p>
                <Link href="/export">
                  <div className="w-full">
                    <Button variant="outline" className="w-full">
                      Export Now
                    </Button>
                  </div>
                </Link>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-amber-100 rounded-lg mr-3">
                    <i className="fas fa-bug text-amber-600"></i>
                  </div>
                  <h4 className="font-semibold text-gray-900">Debug Mode</h4>
                </div>
                <p className="text-gray-600 text-sm mb-4">Enable visual debugging for scraping process</p>
                <Button variant="outline" className="w-full">
                  Enable Debug
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ContestantEditModal
        contestant={selectedContestant}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  );
}
