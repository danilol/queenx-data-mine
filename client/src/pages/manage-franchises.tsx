import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Save, X, Globe } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { Franchise, InsertFranchise } from "@shared/schema";

export default function ManageFranchises() {
  const [editingFranchise, setEditingFranchise] = useState<Franchise | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<InsertFranchise>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: franchises = [], isLoading } = useQuery({
    queryKey: ["/api/franchises"],
    queryFn: async () => {
      const response = await fetch("/api/franchises");
      if (!response.ok) throw new Error("Failed to fetch franchises");
      return response.json() as Promise<Franchise[]>;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertFranchise) => apiRequest("/api/franchises", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/franchises"] });
      setIsCreateDialogOpen(false);
      setFormData({});
      toast({ title: "Franchise created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create franchise", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertFranchise> }) =>
      apiRequest(`/api/franchises/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/franchises"] });
      setEditingFranchise(null);
      toast({ title: "Franchise updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update franchise", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/franchises/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/franchises"] });
      toast({ title: "Franchise deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete franchise", variant: "destructive" });
    },
  });

  const handleCreate = () => {
    if (!formData.name?.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData as InsertFranchise);
  };

  const handleUpdate = () => {
    if (!editingFranchise) return;
    updateMutation.mutate({ id: editingFranchise.id, data: formData });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this franchise?")) {
      deleteMutation.mutate(id);
    }
  };

  const startEdit = (franchise: Franchise) => {
    setEditingFranchise(franchise);
    setFormData({
      name: franchise.name,
      sourceUrl: franchise.sourceUrl || "",
    });
  };

  const cancelEdit = () => {
    setEditingFranchise(null);
    setFormData({});
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Manage Franchises</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Franchise
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Franchise</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Franchise Name *"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Franchises ({franchises.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading franchises...</div>
            ) : franchises.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No franchises found. Create your first franchise above.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Source URL</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {franchises.map((franchise) => (
                      <TableRow key={franchise.id}>
                        <TableCell>
                          {editingFranchise?.id === franchise.id ? (
                            <Input
                              value={formData.name || ""}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              className="w-48"
                            />
                          ) : (
                            <div className="font-medium">{franchise.name}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingFranchise?.id === franchise.id ? (
                            <Input
                              value={formData.sourceUrl || ""}
                              onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                              className="w-64"
                            />
                          ) : (
                            <div className="max-w-xs truncate text-sm">
                              {franchise.sourceUrl ? (
                                <a 
                                  href={franchise.sourceUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  {franchise.sourceUrl}
                                </a>
                              ) : (
                                "-"
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {franchise.createdAt ? new Date(franchise.createdAt).toLocaleDateString() : "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {editingFranchise?.id === franchise.id ? (
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
                                <Button size="sm" variant="outline" onClick={() => startEdit(franchise)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDelete(franchise.id)}
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