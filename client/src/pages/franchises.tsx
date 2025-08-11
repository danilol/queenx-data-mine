import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { type Franchise } from "@shared/schema";

export default function Franchises() {
  const { data: franchises = [], isLoading } = useQuery<Franchise[]>({
    queryKey: ["/api/franchises"],
    queryFn: api.getFranchises,
  });

  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full overflow-y-auto">
        <Header
          title="Franchises"
          subtitle="Manage and view all available Drag Race franchises"
        />

        <div className="p-6">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle>All Franchises</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="p-12 text-center">
                  <p className="text-muted-foreground text-lg">Loading franchises...</p>
                </div>
              ) : franchises.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-muted-foreground text-lg">No franchises found.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Created At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {franchises.map((franchise) => (
                      <TableRow key={franchise.id}>
                        <TableCell className="font-medium">{franchise.name}</TableCell>
                        <TableCell>{franchise.createdAt ? new Date(franchise.createdAt).toLocaleDateString() : "N/A"}</TableCell>
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
