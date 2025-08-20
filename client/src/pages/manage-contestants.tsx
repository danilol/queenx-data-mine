import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Edit, Trash2, Search, Save, X, ChevronDown, ChevronRight, Image, ImageOff } from "lucide-react";
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
import { AppearancesList } from "@/components/related-data";
import { SortableTableHead } from "@/components/ui/sortable-table";
import { DataPagination } from "@/components/ui/data-pagination";
import type { FullContestant, InsertContestant, UpdateContestant } from "@shared/schema";

export default function ManageContestants() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<InsertContestant>>({});
  const [expandedContestants, setExpandedContestants] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<string>('dragName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contestants = [], isLoading } = useQuery({
    queryKey: ["/api/contestants", searchTerm, sortBy, sortOrder, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) {
        params.set('search', searchTerm);
      } else {
        params.set('sortBy', sortBy);
        params.set('sortOrder', sortOrder);
        params.set('page', currentPage.toString());
        params.set('limit', itemsPerPage.toString());
      }
      
      const url = `/api/contestants?${params.toString()}`;
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

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this contestant?")) {
      deleteMutation.mutate(id);
    }
  };

  const toggleExpanded = (contestantId: string) => {
    const newExpanded = new Set(expandedContestants);
    if (newExpanded.has(contestantId)) {
      newExpanded.delete(contestantId);
    } else {
      newExpanded.add(contestantId);
    }
    setExpandedContestants(newExpanded);
  };

  const handleSort = (newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset page when search term changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Manage Contestants" subtitle="Add, edit, and manage contestant information" />
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
                  placeholder="Metadata Source URL (optional)"
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
                      <SortableTableHead 
                        sortKey="dragName"
                        currentSortBy={sortBy}
                        currentSortOrder={sortOrder}
                        onSort={handleSort}
                      >
                        Drag Name
                      </SortableTableHead>
                      <SortableTableHead 
                        sortKey="realName"
                        currentSortBy={sortBy}
                        currentSortOrder={sortOrder}
                        onSort={handleSort}
                      >
                        Real Name
                      </SortableTableHead>
                      <SortableTableHead 
                        sortKey="hometown"
                        currentSortBy={sortBy}
                        currentSortOrder={sortOrder}
                        onSort={handleSort}
                      >
                        Hometown
                      </SortableTableHead>
                      <TableHead>Season</TableHead>
                      <TableHead>Outcome</TableHead>
                      <TableHead>Images</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contestants.map((contestant) => (
                      <TableRow key={contestant.id}>
                        <TableCell>
                          <div className="font-medium">{contestant.dragName}</div>
                        </TableCell>
                        <TableCell>
                          {contestant.realName || "-"}
                        </TableCell>
                        <TableCell>
                          {contestant.hometown || "-"}
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
                          <div className="flex items-center gap-1">
                            {contestant.hasImages ? (
                              <>
                                <Image className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-600">
                                  {contestant.imageCount || 0}
                                </span>
                              </>
                            ) : (
                              <ImageOff className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => navigate(`/manage/contestants/${contestant.id}`)}
                            >
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
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* Only show pagination when not searching */}
                {!searchTerm && contestants.length === itemsPerPage && (
                  <div className="mt-6">
                    <DataPagination
                      currentPage={currentPage}
                      totalItems={293} // We'd need to get this from API
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