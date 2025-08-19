import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Search, Save, X } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import type { FullContestant, InsertContestant, UpdateContestant } from "@shared/schema";

export default function ManageContestants() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingContestant, setEditingContestant] = useState<FullContestant | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<InsertContestant>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contestants = [], isLoading } = useQuery({
    queryKey: ["/api/contestants", searchTerm],
    queryFn: async () => {
      const url = searchTerm ? `/api/contestants?search=${encodeURIComponent(searchTerm)}` : "/api/contestants";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch contestants");
      return response.json() as Promise<FullContestant[]>;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertContestant) => apiRequest("/api/contestants", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contestants"] });
      setIsCreateDialogOpen(false);
      setFormData({});
      toast({ title: "Contestant created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create contestant", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContestant }) =>
      apiRequest(`/api/contestants/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contestants"] });
      setEditingContestant(null);
      toast({ title: "Contestant updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update contestant", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/contestants/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contestants"] });
      toast({ title: "Contestant deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete contestant", variant: "destructive" });
    },
  });

  const handleCreate = () => {
    if (!formData.dragName?.trim()) {
      toast({ title: "Drag name is required", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData as InsertContestant);
  };

  const handleUpdate = () => {
    if (!editingContestant) return;
    updateMutation.mutate({ id: editingContestant.id, data: formData });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this contestant?")) {
      deleteMutation.mutate(id);
    }
  };

  const startEdit = (contestant: FullContestant) => {
    setEditingContestant(contestant);
    setFormData({
      dragName: contestant.dragName,
      realName: contestant.realName || "",
      hometown: contestant.hometown || "",
      biography: contestant.biography || "",
      photoUrl: contestant.photoUrl || "",
      sourceUrl: contestant.sourceUrl || "",
    });
  };

  const cancelEdit = () => {
    setEditingContestant(null);
    setFormData({});
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Manage Contestants</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Contestant
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Contestant</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Drag Name *"
                  value={formData.dragName || ""}
                  onChange={(e) => setFormData({ ...formData, dragName: e.target.value })}
                />
                <Input
                  placeholder="Real Name"
                  value={formData.realName || ""}
                  onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
                />
                <Input
                  placeholder="Hometown"
                  value={formData.hometown || ""}
                  onChange={(e) => setFormData({ ...formData, hometown: e.target.value })}
                />
                <Textarea
                  placeholder="Biography"
                  value={formData.biography || ""}
                  onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
                  rows={3}
                />
                <Input
                  placeholder="Photo URL"
                  value={formData.photoUrl || ""}
                  onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                />
                <Input
                  placeholder="Source URL"
                  value={formData.sourceUrl || ""}
                  onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
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

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Contestants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search by drag name, real name, or hometown..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contestants ({contestants.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading contestants...</div>
            ) : contestants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "No contestants found matching your search." : "No contestants found."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Drag Name</TableHead>
                      <TableHead>Real Name</TableHead>
                      <TableHead>Hometown</TableHead>
                      <TableHead>Season</TableHead>
                      <TableHead>Outcome</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contestants.map((contestant) => (
                      <TableRow key={contestant.id}>
                        <TableCell>
                          {editingContestant?.id === contestant.id ? (
                            <Input
                              value={formData.dragName || ""}
                              onChange={(e) => setFormData({ ...formData, dragName: e.target.value })}
                              className="w-32"
                            />
                          ) : (
                            <div className="font-medium">{contestant.dragName}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingContestant?.id === contestant.id ? (
                            <Input
                              value={formData.realName || ""}
                              onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
                              className="w-32"
                            />
                          ) : (
                            contestant.realName || "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {editingContestant?.id === contestant.id ? (
                            <Input
                              value={formData.hometown || ""}
                              onChange={(e) => setFormData({ ...formData, hometown: e.target.value })}
                              className="w-32"
                            />
                          ) : (
                            contestant.hometown || "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {contestant.season ? (
                            <Badge variant="secondary">{contestant.season}</Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {contestant.outcome ? (
                            <Badge variant={contestant.outcome.toLowerCase().includes('winner') ? 'default' : 'outline'}>
                              {contestant.outcome}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {editingContestant?.id === contestant.id ? (
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
                                <Button size="sm" variant="outline" onClick={() => startEdit(contestant)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDelete(contestant.id)}
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