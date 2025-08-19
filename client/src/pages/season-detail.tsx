import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Save, X, Edit } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ContestantsList } from "@/components/related-data";
import type { Season, Franchise, InsertSeason } from "@shared/schema";

export default function SeasonDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<InsertSeason>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: season, isLoading } = useQuery<Season & { franchise?: Franchise }>({
    queryKey: ["/api/seasons", id],
    enabled: !!id,
  });

  const { data: franchises } = useQuery<Franchise[]>({
    queryKey: ["/api/franchises"],
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertSeason) => {
      const response = await fetch(`/api/seasons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update season");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/seasons", id] });
      toast({ title: "Season updated successfully" });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Error updating season",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const handleEdit = () => {
    if (season) {
      setFormData({
        name: season.name,
        franchiseId: season.franchiseId,
        year: season.year,
        sourceUrl: season.sourceUrl || "",
      });
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (formData.name && formData.franchiseId) {
      updateMutation.mutate(formData as InsertSeason);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({});
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Season Details" subtitle="Loading..." />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="h-32 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!season) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Season Not Found" subtitle="The season you're looking for doesn't exist" />
        <div className="container mx-auto px-4 py-8">
          <Button onClick={() => navigate("/manage/seasons")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Seasons
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title={season.name} 
        subtitle={`Season details for ${season.franchise?.name || "Unknown Franchise"}`} 
      />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate("/manage/seasons")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Seasons
          </Button>
          {!isEditing && (
            <Button onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Season
            </Button>
          )}
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Season Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Name
                  </label>
                  {isEditing ? (
                    <Input
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Season name"
                    />
                  ) : (
                    <p className="text-lg font-semibold">{season.name}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Franchise
                  </label>
                  {isEditing ? (
                    <Select 
                      value={formData.franchiseId || ""} 
                      onValueChange={(value) => setFormData({ ...formData, franchiseId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select franchise" />
                      </SelectTrigger>
                      <SelectContent>
                        {franchises?.map((franchise) => (
                          <SelectItem key={franchise.id} value={franchise.id}>
                            {franchise.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-gray-600">{season.franchise?.name || "Unknown Franchise"}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Year
                  </label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={formData.year || ""}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="Season year"
                    />
                  ) : (
                    <p className="text-gray-600">{season.year || "Not specified"}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Source URL
                  </label>
                  {isEditing ? (
                    <Input
                      value={formData.sourceUrl || ""}
                      onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                      placeholder="Source URL"
                    />
                  ) : (
                    <p className="text-gray-600">
                      {season.sourceUrl ? (
                        <a 
                          href={season.sourceUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {season.sourceUrl}
                        </a>
                      ) : (
                        "No source URL"
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Status
                  </label>
                  <Badge variant={season.isScraped ? "default" : "outline"}>
                    {season.isScraped ? "Scraped" : "Not Scraped"}
                  </Badge>
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleSave} 
                    disabled={updateMutation.isPending || !formData.name || !formData.franchiseId}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Related Contestants</CardTitle>
            </CardHeader>
            <CardContent>
              <ContestantsList seasonId={season.id} seasonName={season.name} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}