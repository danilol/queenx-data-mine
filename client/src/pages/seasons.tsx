import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { type Season as BaseSeason, type Franchise } from "@shared/schema";
import { Play, Loader2 } from "lucide-react";

type SeasonWithFranchise = BaseSeason & { franchiseName: string };

export default function Seasons() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [sortBy, setSortBy] = React.useState<keyof SeasonWithFranchise | 'franchiseName'>('year');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');
  const [franchiseId, setFranchiseId] = React.useState<string>('');
  const [searchTerm, setSearchTerm] = React.useState<string>('');

  const { data: franchises = [] } = useQuery<Franchise[]>({
    queryKey: ["/api/franchises"],
    queryFn: api.getFranchises,
  });

  const { data: seasons = [], isLoading } = useQuery<SeasonWithFranchise[]>({ 
    queryKey: ["/api/seasons", { franchiseId, sortBy, sortOrder, search: searchTerm }],
    queryFn: () => api.getSeasons({ franchiseId, sortBy, sortOrder, search: searchTerm }) as Promise<SeasonWithFranchise[]>,
  });

  const { data: scrapingStatus } = useQuery({
    queryKey: ["/api/scraping/status"],
    queryFn: api.getScrapingStatus,
    refetchInterval: 3000,
  });

  const startSeasonScraping = useMutation({
    mutationFn: (season: SeasonWithFranchise) => api.startScraping({
      level: "season",
      seasonId: season.id,
      sourceUrl: season.sourceUrl || undefined
    }),
    onSuccess: () => {
      toast({
        title: "Scraping Started",
        description: "Season scraping has started successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/scraping/status"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to start scraping",
        variant: "destructive",
      });
    },
  });

  const handleSort = (column: keyof SeasonWithFranchise | 'franchiseName') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const isScrapingRunning = scrapingStatus && 'status' in scrapingStatus && scrapingStatus.status === 'running';

  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full overflow-y-auto">
        <Header
          title="Seasons"
          subtitle="Manage and view all available Drag Race seasons"
        />

        <div className="p-6">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle>All Seasons</CardTitle>
              <div className="flex items-center space-x-2 pt-4">
                <Input
                  placeholder="Search seasons..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                <Select onValueChange={(value) => setFranchiseId(value === 'all' ? '' : value)} value={franchiseId || 'all'}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by franchise" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Franchises</SelectItem>
                    {franchises.map((franchise) => (
                      <SelectItem key={franchise.id} value={franchise.id}>
                        {franchise.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="p-12 text-center">
                  <p className="text-muted-foreground text-lg">Loading seasons...</p>
                </div>
              ) : seasons.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-muted-foreground text-lg">No seasons found.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead onClick={() => handleSort('franchiseName')} className="cursor-pointer">Franchise {sortBy === 'franchiseName' && (sortOrder === 'asc' ? '↑' : '↓')}</TableHead>
                      <TableHead onClick={() => handleSort('name')} className="cursor-pointer">Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}</TableHead>
                      <TableHead onClick={() => handleSort('year')} className="cursor-pointer">Year {sortBy === 'year' && (sortOrder === 'asc' ? '↑' : '↓')}</TableHead>
                      <TableHead onClick={() => handleSort('createdAt')} className="cursor-pointer">Created At {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {seasons.map((season) => (
                      <TableRow key={season.id}>
                        <TableCell>{season.franchiseName}</TableCell>
                        <TableCell className="font-medium">{season.name}</TableCell>
                        <TableCell>{season.year}</TableCell>
                        <TableCell>{season.createdAt ? new Date(season.createdAt).toLocaleDateString() : "N/A"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isScrapingRunning || startSeasonScraping.isPending}
                            onClick={() => startSeasonScraping.mutate(season)}
                            className="gap-2"
                          >
                            {startSeasonScraping.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                            {startSeasonScraping.isPending ? "Starting..." : "Scrape Season"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
