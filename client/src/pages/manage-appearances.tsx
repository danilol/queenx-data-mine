import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Save, X, Users } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Appearance, InsertAppearance, FullContestant } from "@shared/schema";

interface AppearanceWithDetails extends Appearance {
  contestantDragName: string;
  seasonName: string;
  franchiseName: string;
}

interface Season {
  id: string;
  name: string;
  franchiseName: string;
}

export default function ManageAppearances() {
  const [editingAppearance, setEditingAppearance] = useState<AppearanceWithDetails | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<InsertAppearance>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: appearances = [], isLoading } = useQuery({
    queryKey: ["/api/appearances"],
    queryFn: async () => {
      const response = await fetch("/api/appearances");
      if (!response.ok) throw new Error("Failed to fetch appearances");
      return response.json() as Promise<AppearanceWithDetails[]>;
    },
  });

  const { data: contestants = [] } = useQuery({
    queryKey: ["/api/contestants"],
    queryFn: async () => {
      const response = await fetch("/api/contestants");
      if (!response.ok) throw new Error("Failed to fetch contestants");
      return response.json() as Promise<FullContestant[]>;
    },
  });

  const { data: seasons = [] } = useQuery({
    queryKey: ["/api/seasons"],
    queryFn: async () => {
      const response = await fetch("/api/seasons");
      if (!response.ok) throw new Error("Failed to fetch seasons");
      return response.json() as Promise<Season[]>;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertAppearance) => apiRequest("/api/appearances", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appearances"] });
      setIsCreateDialogOpen(false);
      setFormData({});
      toast({ title: "Appearance created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create appearance", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertAppearance> }) =>
      apiRequest(`/api/appearances/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appearances"] });
      setEditingAppearance(null);
      toast({ title: "Appearance updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update appearance", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/appearances/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appearances"] });
      toast({ title: "Appearance deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete appearance", variant: "destructive" });
    },
  });

  const handleCreate = () => {
    if (!formData.contestantId || !formData.seasonId) {
      toast({ title: "Contestant and season are required", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData as InsertAppearance);
  };

  const handleUpdate = () => {
    if (!editingAppearance) return;
    updateMutation.mutate({ id: editingAppearance.id, data: formData });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this appearance?")) {
      deleteMutation.mutate(id);
    }
  };

  const startEdit = (appearance: AppearanceWithDetails) => {
    setEditingAppearance(appearance);
    setFormData({
      contestantId: appearance.contestantId,
      seasonId: appearance.seasonId,
      age: appearance.age || undefined,
      outcome: appearance.outcome || "",
    });
  };

  const cancelEdit = () => {
    setEditingAppearance(null);
    setFormData({});
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Manage Appearances</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Appearance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Appearance</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Select
                  value={formData.contestantId || ""}
                  onValueChange={(value) => setFormData({ ...formData, contestantId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Contestant *" />
                  </SelectTrigger>
                  <SelectContent>
                    {contestants.map((contestant) => (
                      <SelectItem key={contestant.id} value={contestant.id}>
                        {contestant.dragName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={formData.seasonId || ""}
                  onValueChange={(value) => setFormData({ ...formData, seasonId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Season *" />
                  </SelectTrigger>
                  <SelectContent>
                    {seasons.map((season) => (
                      <SelectItem key={season.id} value={season.id}>
                        {season.name} ({season.franchiseName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Age at time of filming"
                  value={formData.age || ""}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value ? parseInt(e.target.value) : undefined })}
                />
                <Input
                  placeholder="Outcome (e.g., Winner, Runner-up, 3rd Place)"
                  value={formData.outcome || ""}
                  onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                />
                <div className="flex gap-2">
                  <Button onClick={handleCreate} disabled={createMutation.isPending} className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    {createMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Appearances ({appearances.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading appearances...</div>
            ) : appearances.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No appearances found. Create your first appearance above.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contestant</TableHead>
                      <TableHead>Season</TableHead>
                      <TableHead>Franchise</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Outcome</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appearances.map((appearance) => (
                      <TableRow key={appearance.id}>
                        <TableCell>
                          {editingAppearance?.id === appearance.id ? (
                            <Select
                              value={formData.contestantId || ""}
                              onValueChange={(value) => setFormData({ ...formData, contestantId: value })}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {contestants.map((contestant) => (
                                  <SelectItem key={contestant.id} value={contestant.id}>
                                    {contestant.dragName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="font-medium">{appearance.contestantDragName}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingAppearance?.id === appearance.id ? (
                            <Select
                              value={formData.seasonId || ""}
                              onValueChange={(value) => setFormData({ ...formData, seasonId: value })}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {seasons.map((season) => (
                                  <SelectItem key={season.id} value={season.id}>
                                    {season.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            appearance.seasonName
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{appearance.franchiseName}</Badge>
                        </TableCell>
                        <TableCell>
                          {editingAppearance?.id === appearance.id ? (
                            <Input
                              type="number"
                              value={formData.age || ""}
                              onChange={(e) => setFormData({ ...formData, age: e.target.value ? parseInt(e.target.value) : undefined })}
                              className="w-16"
                            />
                          ) : (
                            appearance.age || "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {editingAppearance?.id === appearance.id ? (
                            <Input
                              value={formData.outcome || ""}
                              onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                              className="w-32"
                            />
                          ) : (
                            appearance.outcome ? (
                              <Badge variant={appearance.outcome.toLowerCase().includes('winner') ? 'default' : 'outline'}>
                                {appearance.outcome}
                              </Badge>
                            ) : (
                              "-"
                            )
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {editingAppearance?.id === appearance.id ? (
                              <>
                                <Button size="sm" onClick={handleUpdate} disabled={updateMutation.isPending}>
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={cancelEdit}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button size="sm" variant="outline" onClick={() => startEdit(appearance)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDelete(appearance.id)}
                                  disabled={deleteMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}