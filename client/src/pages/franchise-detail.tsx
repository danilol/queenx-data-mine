import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Save, X, Edit, Download } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { api } from "@/lib/api";
import { SeasonsList } from "@/components/related-data";
import type { Franchise, InsertFranchise } from "@shared/schema";

export default function FranchiseDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<InsertFranchise>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: franchise, isLoading } = useQuery<Franchise>({
    queryKey: ["/api/franchises", id],
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertFranchise) => {
      const response = await fetch(`/api/franchises/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update franchise");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/franchises"] });
      queryClient.invalidateQueries({ queryKey: ["/api/franchises", id] });
      toast({ title: "Franchise updated successfully" });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Error updating franchise",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const handleEdit = () => {
    if (franchise) {
      setFormData({
        name: franchise.name,
        sourceUrl: franchise.sourceUrl || "",
      });
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (formData.name) {
      updateMutation.mutate(formData as InsertFranchise);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({});
  };

  const scrapeFranchiseMutation = useMutation({
    mutationFn: () => api.startScraping({ 
      level: 'franchise', 
      sourceUrl: franchise?.sourceUrl || undefined 
    }),
    onSuccess: () => {
      toast({
        title: "Franchise Scraping Started",
        description: `Started scraping data for ${franchise?.name}. Check the Scraper page for progress.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Start Scraping",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Franchise Details" subtitle="Loading..." />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="h-32 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!franchise) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Franchise Not Found" subtitle="The franchise you're looking for doesn't exist" />
        <div className="container mx-auto px-4 py-8">
          <Button onClick={() => navigate("/manage/franchises")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Franchises
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title={franchise.name} 
        subtitle="Franchise details and management" 
      />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate("/manage/franchises")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Franchises
          </Button>
          {!isEditing && (
            <>
              <Button onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Franchise
              </Button>
              <Button 
                onClick={() => scrapeFranchiseMutation.mutate()}
                disabled={scrapeFranchiseMutation.isPending}
                variant="secondary"
              >
                <Download className="h-4 w-4 mr-2" />
                {scrapeFranchiseMutation.isPending ? "Starting..." : "Scrape Franchise"}
              </Button>
            </>
          )}
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Franchise Information</CardTitle>
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
                      placeholder="Franchise name"
                    />
                  ) : (
                    <p className="text-lg font-semibold">{franchise.name}</p>
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
                        "No source URL"
                      )}
                    </p>
                  )}
                </div>


              </div>

              {isEditing && (
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleSave} 
                    disabled={updateMutation.isPending || !formData.name}
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
              <CardTitle>Related Seasons</CardTitle>
            </CardHeader>
            <CardContent>
              <SeasonsList franchiseId={franchise.id} franchiseName={franchise.name} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}