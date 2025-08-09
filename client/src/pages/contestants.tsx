import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import { Header } from "@/components/layout/header";
import { ContestantEditModal } from "@/components/contestant-edit-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { type Contestant } from "@shared/schema";

export default function Contestants() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContestant, setSelectedContestant] = useState<Contestant | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contestants = [], isLoading } = useQuery({
    queryKey: ["/api/contestants", searchQuery],
    queryFn: () => api.getContestants(searchQuery || undefined),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteContestant(id),
    onSuccess: () => {
      toast({
        title: "Contestant Deleted",
        description: "The contestant has been successfully removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contestants"] });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete contestant",
        variant: "destructive",
      });
    },
  });

  const handleEditContestant = (contestant: Contestant) => {
    setSelectedContestant(contestant);
    setIsEditModalOpen(true);
  };

  const handleDeleteContestant = (contestant: Contestant) => {
    if (window.confirm(`Are you sure you want to delete ${contestant.dragName}?`)) {
      deleteMutation.mutate(contestant.id);
    }
  };

  const handleAddNew = () => {
    setSelectedContestant({
      id: "",
      dragName: "",
      realName: "",
      hometown: "",
      biography: "",
      photoUrl: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Contestant);
    setIsEditModalOpen(true);
  };

  const getOutcomeVariant = (outcome: string | undefined) => {
    if (!outcome) return "outline";
    const lower = outcome.toLowerCase();
    if (lower.includes("winner")) return "default";
    if (lower.includes("runner-up")) return "secondary";
    return "outline";
  };

  const groupedContestants = contestants.reduce((groups, contestant) => {
    const franchise = contestant.franchise || "US";
    if (!groups[franchise]) {
      groups[franchise] = [];
    }
    groups[franchise].push(contestant);
    return groups;
  }, {} as Record<string, Contestant[]>);

  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full overflow-y-auto">
        <Header
          title="Contestants"
          subtitle="Manage drag race contestant data and information"
        />

        <div className="p-6 space-y-6">
          {/* Search and Actions */}
          <Card className="card-enhanced">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-lg">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by drag name, real name, hometown, or season..."
                    className="pl-10 h-11"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddNew} className="h-11 px-6">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contestant
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {isLoading ? (
            <Card className="card-enhanced">
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground text-lg">Loading contestants...</p>
              </CardContent>
            </Card>
          ) : contestants.length === 0 ? (
            <Card className="card-enhanced">
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground text-lg">
                  {searchQuery
                    ? "No contestants found matching your search."
                    : "No contestants found. Start scraping to populate the database."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedContestants).map(([franchise, franchiseContestants]) => (
                <Card key={franchise} className="card-enhanced">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-foreground">
                        {franchise === "US" ? "RuPaul's Drag Race (US)" : `Drag Race ${franchise}`}
                      </h3>
                      <Badge variant="secondary" className="px-3 py-1">
                        {franchiseContestants.length} contestants
                      </Badge>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-2 font-medium text-muted-foreground text-sm">Photo</th>
                            <th className="text-left py-3 px-2 font-medium text-muted-foreground text-sm">Drag Name</th>
                            <th className="text-left py-3 px-2 font-medium text-muted-foreground text-sm">Real Name</th>
                            <th className="text-left py-3 px-2 font-medium text-muted-foreground text-sm">Age</th>
                            <th className="text-left py-3 px-2 font-medium text-muted-foreground text-sm">Season</th>
                            <th className="text-left py-3 px-2 font-medium text-muted-foreground text-sm">Hometown</th>
                            <th className="text-left py-3 px-2 font-medium text-muted-foreground text-sm">Outcome</th>
                            <th className="text-left py-3 px-2 font-medium text-muted-foreground text-sm">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {franchiseContestants.map((contestant) => (
                            <tr key={contestant.id} className="hover:bg-muted/50">
                              <td className="py-4 px-2">
                                {contestant.photoUrl ? (
                                  <img
                                    src={contestant.photoUrl}
                                    alt={contestant.dragName}
                                    className="w-12 h-12 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                                    <span className="text-muted-foreground text-xs">No Photo</span>
                                  </div>
                                )}
                              </td>
                              <td className="py-4 px-2">
                                <div className="font-semibold text-foreground">{contestant.dragName}</div>
                              </td>
                              <td className="py-4 px-2 text-muted-foreground">{contestant.realName || "—"}</td>
                              <td className="py-4 px-2 text-muted-foreground">—</td>
                              <td className="py-4 px-2">
                                <Badge variant="secondary">—</Badge>
                              </td>
                              <td className="py-4 px-2 text-muted-foreground">{contestant.hometown || "—"}</td>
                              <td className="py-4 px-2">
                                <span className="text-muted-foreground">—</span>
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
                                    disabled={deleteMutation.isPending}
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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
