import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, AlertCircle, Play, ChevronDown, ChevronRight } from "lucide-react";
import { seasonStatusSchema } from "@shared/schema";
import { z } from "zod";
import { useState } from "react";

interface FranchiseProgressProps {
  seasons: z.infer<typeof seasonStatusSchema>[];
}

export function FranchiseProgress({ seasons }: FranchiseProgressProps) {
  const [expandedFranchises, setExpandedFranchises] = useState<Record<string, boolean>>({});

  const seasonsByFranchise = seasons.reduce((acc, season) => {
    if (!acc[season.franchiseName]) {
      acc[season.franchiseName] = [];
    }
    acc[season.franchiseName].push(season);
    return acc;
  }, {} as Record<string, z.infer<typeof seasonStatusSchema>[]>);

  const toggleFranchise = (franchiseName: string) => {
    setExpandedFranchises(prev => ({ ...prev, [franchiseName]: !prev[franchiseName] }));
  };

  const getFranchiseProgress = (franchiseSeasons: z.infer<typeof seasonStatusSchema>[]) => {
    const completed = franchiseSeasons.filter(s => s.status === 'completed').length;
    return (completed / franchiseSeasons.length) * 100;
  };

  const getStatusIcon = (status: 'pending' | 'running' | 'completed' | 'failed') => {
    switch (status) {
      case 'completed':
        return <span title="Completed"><CheckCircle className="h-4 w-4 text-emerald-500" /></span>;
      case 'running':
        return <span title="Running"><Play className="h-4 w-4 text-blue-500 animate-pulse" /></span>;
      case 'pending':
        return <span title="Pending"><Clock className="h-4 w-4 text-gray-400" /></span>;
      case 'failed':
        return <span title="Failed"><AlertCircle className="h-4 w-4 text-red-500" /></span>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detailed Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(seasonsByFranchise).map(([franchiseName, franchiseSeasons]) => (
            <div key={franchiseName} className="border rounded-lg p-4">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleFranchise(franchiseName)}>
                <div className="flex items-center">
                  {expandedFranchises[franchiseName] ? <ChevronDown className="h-5 w-5 mr-2" /> : <ChevronRight className="h-5 w-5 mr-2" />}
                  <h4 className="font-semibold">{franchiseName}</h4>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">{getFranchiseProgress(franchiseSeasons).toFixed(0)}%</span>
                  <Progress value={getFranchiseProgress(franchiseSeasons)} className="w-32 h-2" />
                </div>
              </div>
              {expandedFranchises[franchiseName] && (
                <div className="mt-4 pl-7 space-y-2">
                  {franchiseSeasons.map(season => (
                    <div key={season.name} className="flex items-center justify-between">
                      <span className="text-sm">{season.name}</span>
                      {getStatusIcon(season.status)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
