import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Edit, Trash2, Save, X, Globe, ChevronDown, ChevronRight } from "lucide-react";
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
import { SeasonsList } from "@/components/related-data";
import { SortableTableHead } from "@/components/ui/sortable-table";
import { DataPagination } from "@/components/ui/data-pagination";
import type { Franchise, InsertFranchise } from "@shared/schema";

export default function ManageFranchises() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<InsertFranchise>>({});
  const [expandedFranchises, setExpandedFranchises] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: franchises = [], isLoading } = useQuery({
    queryKey: ["/api/franchises", sortBy, sortOrder, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        sortBy,
        sortOrder,
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });
      
      const response = await fetch(`/api/franchises?${params.toString()}`);
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

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this franchise?")) {
      deleteMutation.mutate(id);
    }
  };

  const toggleExpanded = (franchiseId: string) => {
    const newExpanded = new Set(expandedFranchises);
    if (newExpanded.has(franchiseId)) {
      newExpanded.delete(franchiseId);
    } else {
      newExpanded.add(franchiseId);
    }
    setExpandedFranchises(newExpanded);
  };

  const handleSort = (newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Manage Franchises" subtitle="Add, edit, and manage franchise information" />
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
                  value={formData.metadataSourceUrl || ""}
                  onChange={(e) => setFormData({ ...formData, metadataSourceUrl: e.target.value })}
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
                      <TableHead className="w-8"></TableHead>
                      <SortableTableHead 
                        sortKey="name"
                        currentSortBy={sortBy}
                        currentSortOrder={sortOrder}
                        onSort={handleSort}
                      >
                        Name
                      </SortableTableHead>
                      <TableHead>Source URL</TableHead>
                      <SortableTableHead 
                        sortKey="createdAt"
                        currentSortBy={sortBy}
                        currentSortOrder={sortOrder}
                        onSort={handleSort}
                      >
                        Created
                      </SortableTableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {franchises.map((franchise) => (
                      <React.Fragment key={franchise.id}>
                        <TableRow>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpanded(franchise.id)}
                              className="p-1 h-8 w-8"
                            >
                              {expandedFranchises.has(franchise.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{franchise.name}</div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate text-sm">
                              {franchise.metadataSourceUrl ? (
                                <a 
                                  href={franchise.metadataSourceUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  {franchise.metadataSourceUrl}
                                </a>
                              ) : (
                                "-"
                              )}
                            </div>
                          </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {franchise.createdAt ? new Date(franchise.createdAt).toLocaleDateString() : "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => navigate(`/manage/franchises/${franchise.id}`)}
                            >
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
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedFranchises.has(franchise.id) && (
                        <TableRow>
                          <TableCell colSpan={5} className="p-0">
                            <div className="px-4 py-2 bg-muted/20">
                              <SeasonsList franchiseId={franchise.id} franchiseName={franchise.name} />
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
                
                {franchises.length === itemsPerPage && (
                  <div className="mt-6">
                    <DataPagination
                      currentPage={currentPage}
                      totalItems={19} // We'd need to get this from API
                      itemsPerPage={itemsPerPage}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}