import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { type Season as BaseSeason } from "@shared/schema";

type SeasonWithFranchise = BaseSeason & { franchiseName: string };

export default function Seasons() {
  const { data: seasons = [], isLoading } = useQuery<SeasonWithFranchise[]>({ 
    queryKey: ["/api/seasons"],
    queryFn: api.getSeasons as () => Promise<SeasonWithFranchise[]>,
  });

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
                      <TableHead>Name</TableHead>
                      <TableHead>Franchise</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Created At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {seasons.map((season) => (
                      <TableRow key={season.id}>
                        <TableCell className="font-medium">{season.name}</TableCell>
                        <TableCell>{season.franchiseName}</TableCell>
                        <TableCell>{season.year}</TableCell>
                        <TableCell>{season.createdAt ? new Date(season.createdAt).toLocaleDateString() : "N/A"}</TableCell>
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
