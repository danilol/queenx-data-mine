import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Save, X, Edit, Download } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { api } from "@/lib/api";
import { AppearancesList } from "@/components/related-data";
import type { FullContestant, UpdateContestant } from "@shared/schema";

export default function ContestantDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UpdateContestant>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contestant, isLoading } = useQuery<FullContestant>({
    queryKey: ["/api/contestants", id],
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateContestant) => {
      const response = await fetch(`/api/contestants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update contestant");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contestants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contestants", id] });
      toast({ title: "Contestant updated successfully" });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Error updating contestant",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const handleEdit = () => {
    if (contestant) {
      setFormData({
        dragName: contestant.dragName,
        realName: contestant.realName || "",
        hometown: contestant.hometown || "",
        biography: contestant.biography || "",
        photoUrl: contestant.photoUrl || "",
        sourceUrl: contestant.sourceUrl || "",
      });
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (formData.dragName) {
      updateMutation.mutate(formData as UpdateContestant);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({});
  };

  const scrapeContestantMutation = useMutation({
    mutationFn: () => api.startScraping({ 
      level: 'contestant', 
      sourceUrl: contestant?.sourceUrl || undefined 
    }),
    onSuccess: () => {
      toast({
        title: "Contestant Scraping Started",
        description: `Started scraping data for ${contestant?.dragName}. Check the Scraper page for progress.`,
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

  const imageScrapeMutation = useMutation({
    mutationFn: () => 
      api.scrapeContestantImages({
        contestantId: id,
        contestantName: contestant?.dragName || '',
        sourceUrl: contestant?.sourceUrl || '',
        seasonName: contestant?.season
      }),
    onSuccess: (data) => {
      toast({
        title: "Image Scraping Completed",
        description: `Downloaded ${data.result.imagesDownloaded} images for ${contestant?.dragName}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Image Scraping Failed",
        description: error instanceof Error ? error.message : "Failed to scrape images",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Contestant Details" subtitle="Loading..." />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="h-32 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!contestant) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Contestant Not Found" subtitle="The contestant you're looking for doesn't exist" />
        <div className="container mx-auto px-4 py-8">
          <Button onClick={() => navigate("/manage/contestants")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contestants
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title={contestant.dragName} 
        subtitle="Contestant details and management" 
      />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate("/manage/contestants")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contestants
          </Button>
          {!isEditing && (
            <>
              <Button onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Contestant
              </Button>
              <Button 
                onClick={() => scrapeContestantMutation.mutate()}
                disabled={scrapeContestantMutation.isPending}
                variant="secondary"
              >
                <Download className="h-4 w-4 mr-2" />
                {scrapeContestantMutation.isPending ? "Starting..." : "Scrape Contestant"}
              </Button>
              <Button 
                onClick={() => imageScrapeMutation.mutate()}
                disabled={imageScrapeMutation.isPending || !contestant?.sourceUrl}
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                {imageScrapeMutation.isPending ? "Downloading..." : "Download Images"}
              </Button>
            </>
          )}
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage 
                    src={contestant.photoUrl || undefined} 
                    alt={contestant.dragName} 
                  />
                  <AvatarFallback>
                    {contestant.dragName.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">{contestant.dragName}</h2>
                  {contestant.realName && (
                    <p className="text-gray-600">({contestant.realName})</p>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Drag Name
                  </label>
                  {isEditing ? (
                    <Input
                      value={formData.dragName || ""}
                      onChange={(e) => setFormData({ ...formData, dragName: e.target.value })}
                      placeholder="Drag name"
                    />
                  ) : (
                    <p className="text-lg font-semibold">{contestant.dragName}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Real Name
                  </label>
                  {isEditing ? (
                    <Input
                      value={formData.realName || ""}
                      onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
                      placeholder="Real name"
                    />
                  ) : (
                    <p className="text-gray-600">{contestant.realName || "Not specified"}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Hometown
                  </label>
                  {isEditing ? (
                    <Input
                      value={formData.hometown || ""}
                      onChange={(e) => setFormData({ ...formData, hometown: e.target.value })}
                      placeholder="Hometown"
                    />
                  ) : (
                    <p className="text-gray-600">{contestant.hometown || "Not specified"}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Biography
                  </label>
                  {isEditing ? (
                    <Textarea
                      value={formData.biography || ""}
                      onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
                      placeholder="Biography"
                      rows={4}
                    />
                  ) : (
                    <p className="text-gray-600">
                      {contestant.biography || "No biography available"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Photo URL
                  </label>
                  {isEditing ? (
                    <Input
                      value={formData.photoUrl || ""}
                      onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                      placeholder="Photo URL"
                    />
                  ) : (
                    <p className="text-gray-600">
                      {contestant.photoUrl ? (
                        <a 
                          href={contestant.photoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {contestant.photoUrl}
                        </a>
                      ) : (
                        "No photo URL"
                      )}
                    </p>
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
                      {contestant.sourceUrl ? (
                        <a 
                          href={contestant.sourceUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {contestant.sourceUrl}
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
                    disabled={updateMutation.isPending || !formData.dragName}
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
              <CardTitle>Show Appearances</CardTitle>
            </CardHeader>
            <CardContent>
              <AppearancesList contestantId={contestant.id} contestantName={contestant.dragName} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}