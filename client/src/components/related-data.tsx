import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Trophy, ExternalLink } from "lucide-react";
import type { Season, FullContestant, Appearance } from "@shared/schema";

// Seasons for a franchise
interface SeasonsListProps {
  franchiseId: string;
  franchiseName: string;
}

export function SeasonsList({ franchiseId, franchiseName }: SeasonsListProps) {
  const { data: seasons = [], isLoading } = useQuery({
    queryKey: ["/api/franchises", franchiseId, "seasons"],
    queryFn: async () => {
      const response = await fetch(`/api/franchises/${franchiseId}/seasons`);
      if (!response.ok) throw new Error("Failed to fetch seasons");
      return response.json() as Promise<(Season & { franchiseName: string })[]>;
    },
  });

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Seasons for {franchiseName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">Loading seasons...</div>
        </CardContent>
      </Card>
    );
  }

  if (seasons.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Seasons for {franchiseName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No seasons found for this franchise.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Seasons for {franchiseName} ({seasons.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {seasons.map((season) => (
            <div
              key={season.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div>
                  <h4 className="font-medium">{season.name}</h4>
                  {season.year && (
                    <p className="text-sm text-muted-foreground">Year: {season.year}</p>
                  )}
                </div>
                {season.isScraped && (
                  <Badge variant="secondary">Scraped</Badge>
                )}
              </div>
              <Link to={`/manage/seasons`}>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Contestants for a season
interface ContestantsListProps {
  seasonId: string;
  seasonName: string;
}

export function ContestantsList({ seasonId, seasonName }: ContestantsListProps) {
  const { data: contestants = [], isLoading } = useQuery({
    queryKey: ["/api/seasons", seasonId, "contestants"],
    queryFn: async () => {
      const response = await fetch(`/api/seasons/${seasonId}/contestants`);
      if (!response.ok) throw new Error("Failed to fetch contestants");
      return response.json() as Promise<FullContestant[]>;
    },
  });

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Contestants for {seasonName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">Loading contestants...</div>
        </CardContent>
      </Card>
    );
  }

  if (contestants.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Contestants for {seasonName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No contestants found for this season.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Contestants for {seasonName} ({contestants.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {contestants.map((contestant) => (
            <div
              key={contestant.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {contestant.photoUrl && (
                  <img
                    src={contestant.photoUrl}
                    alt={contestant.dragName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                )}
                <div>
                  <h4 className="font-medium">{contestant.dragName}</h4>
                  {contestant.realName && (
                    <p className="text-sm text-muted-foreground">{contestant.realName}</p>
                  )}
                  {contestant.outcome && (
                    <Badge variant="outline" className="mt-1">
                      {contestant.outcome}
                    </Badge>
                  )}
                </div>
              </div>
              <Link to={`/manage/contestants`}>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Appearances for a contestant
interface AppearancesListProps {
  contestantId: string;
  contestantName: string;
}

export function AppearancesList({ contestantId, contestantName }: AppearancesListProps) {
  const { data: appearances = [], isLoading } = useQuery({
    queryKey: ["/api/contestants", contestantId, "appearances"],
    queryFn: async () => {
      const response = await fetch(`/api/contestants/${contestantId}/appearances`);
      if (!response.ok) throw new Error("Failed to fetch appearances");
      return response.json() as Promise<(Appearance & { seasonName: string; franchiseName: string })[]>;
    },
  });

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Appearances for {contestantName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">Loading appearances...</div>
        </CardContent>
      </Card>
    );
  }

  if (appearances.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Appearances for {contestantName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No appearances found for this contestant.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Appearances for {contestantName} ({appearances.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {appearances.map((appearance) => (
            <div
              key={appearance.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div>
                  <h4 className="font-medium">{appearance.seasonName}</h4>
                  <p className="text-sm text-muted-foreground">{appearance.franchiseName}</p>
                  <div className="flex gap-2 mt-1">
                    {appearance.age && (
                      <Badge variant="outline">Age: {appearance.age}</Badge>
                    )}
                    {appearance.outcome && (
                      <Badge variant="outline">{appearance.outcome}</Badge>
                    )}
                  </div>
                </div>
              </div>
              <Link to={`/manage/appearances`}>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}