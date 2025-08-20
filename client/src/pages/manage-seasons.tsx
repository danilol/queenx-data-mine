import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Edit, Trash2, Save, X, Calendar, ChevronDown, ChevronRight } from "lucide-react";
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
import { ContestantsList } from "@/components/related-data";
import { SortableTableHead } from "@/components/ui/sortable-table";
import { DataPagination } from "@/components/ui/data-pagination";
import type { Season, InsertSeason, Franchise } from "@shared/schema";

interface SeasonWithFranchise extends Season {
  franchiseName: string;
}

export default function ManageSeasons() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<InsertSeason>>({});
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<string>('year');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: seasons = [], isLoading } = useQuery({
    queryKey: ["/api/seasons", sortBy, sortOrder, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        sortBy,
        sortOrder,
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });
      
      const response = await fetch(`/api/seasons?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch seasons");
      return response.json() as Promise<SeasonWithFranchise[]>;
    },
  });

  const { data: franchises = [] } = useQuery({
    queryKey: ["/api/franchises"],
    queryFn: async () => {
      const response = await fetch("/api/franchises");
      if (!response.ok) throw new Error("Failed to fetch franchises");
      return response.json() as Promise<Franchise[]>;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertSeason) => apiRequest("/api/seasons", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasons"] });
      setIsCreateDialogOpen(false);
      setFormData({});
      toast({ title: "Season created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create season", variant: "destructive" });
    },
  });



  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/seasons/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasons"] });
      toast({ title: "Season deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete season", variant: "destructive" });
    },
  });

  const handleCreate = () => {
    if (!formData.name?.trim() || !formData.franchiseId) {
      toast({ title: "Name and franchise are required", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData as InsertSeason);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this season?")) {
      deleteMutation.mutate(id);
    }
  };

  const toggleExpanded = (seasonId: string) => {
    const newExpanded = new Set(expandedSeasons);
    if (newExpanded.has(seasonId)) {
      newExpanded.delete(seasonId);
    } else {
      newExpanded.add(seasonId);
    }
    setExpandedSeasons(newExpanded);
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
      <Header title="Manage Seasons" subtitle="Add, edit, and manage season information" />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Manage Seasons</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Season
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Season</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Season Name *"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <Select
                  value={formData.franchiseId || ""}
                  onValueChange={(value) => setFormData({ ...formData, franchiseId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Franchise *" />
                  </SelectTrigger>
                  <SelectContent>
                    {franchises.map((franchise) => (
                      <SelectItem key={franchise.id} value={franchise.id}>
                        {franchise.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Year"
                  value={formData.year || ""}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value ? parseInt(e.target.value) : undefined })}
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
              <Calendar className="h-5 w-5" />
              Seasons ({seasons.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading seasons...</div>
            ) : seasons.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No seasons found. Create your first season above.
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
                      <SortableTableHead 
                        sortKey="franchiseName"
                        currentSortBy={sortBy}
                        currentSortOrder={sortOrder}
                        onSort={handleSort}
                      >
                        Franchise
                      </SortableTableHead>
                      <SortableTableHead 
                        sortKey="year"
                        currentSortBy={sortBy}
                        currentSortOrder={sortOrder}
                        onSort={handleSort}
                      >
                        Year
                      </SortableTableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {seasons.map((season) => (
                      <React.Fragment key={season.id}>
                        <TableRow>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpanded(season.id)}
                              className="p-1 h-8 w-8"
                            >
                              {expandedSeasons.has(season.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{season.name}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{season.franchiseName}</Badge>
                          </TableCell>
                          <TableCell>
                            {season.year || "-"}
                          </TableCell>
                        <TableCell>
                          <Badge variant={season.isScraped ? "default" : "outline"}>
                            {season.isScraped ? "Scraped" : "Not Scraped"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => navigate(`/manage/seasons/${season.id}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(season.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedSeasons.has(season.id) && (
                        <TableRow>
                          <TableCell colSpan={6} className="p-0">
                            <div className="px-4 py-2 bg-muted/20">
                              <ContestantsList seasonId={season.id} seasonName={season.name} />
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
                
                {seasons.length === itemsPerPage && (
                  <div className="mt-6">
                    <DataPagination
                      currentPage={currentPage}
                      totalItems={79} // We'd need to get this from API
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