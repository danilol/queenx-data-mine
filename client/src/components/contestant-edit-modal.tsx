import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { updateContestantSchema, type Contestant } from "@shared/schema";

interface ContestantEditModalProps {
  contestant: Contestant | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ContestantEditModal({ contestant, isOpen, onClose }: ContestantEditModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(updateContestantSchema),
    defaultValues: {
      dragName: contestant?.dragName || "",
      realName: contestant?.realName || "",
      age: contestant?.age || undefined,
      hometown: contestant?.hometown || "",
      season: contestant?.season || "",
      franchise: contestant?.franchise || "US",
      outcome: contestant?.outcome || "",
      biography: contestant?.biography || "",
      photoUrl: contestant?.photoUrl || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => {
      if (!contestant) throw new Error("No contestant selected");
      return api.updateContestant(contestant.id, data);
    },
    onSuccess: () => {
      toast({
        title: "Contestant Updated",
        description: "The contestant information has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contestants"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update contestant",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    updateMutation.mutate(data);
  };

  // Reset form when contestant changes
  useState(() => {
    if (contestant) {
      form.reset({
        dragName: contestant.dragName,
        realName: contestant.realName || "",
        age: contestant.age || undefined,
        hometown: contestant.hometown || "",
        season: contestant.season,
        franchise: contestant.franchise,
        outcome: contestant.outcome || "",
        biography: contestant.biography || "",
        photoUrl: contestant.photoUrl || "",
      });
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Contestant</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="dragName">Drag Name *</Label>
              <Input
                id="dragName"
                {...form.register("dragName")}
                placeholder="Enter drag name"
              />
              {form.formState.errors.dragName && (
                <p className="text-sm text-red-600">{form.formState.errors.dragName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="realName">Real Name</Label>
              <Input
                id="realName"
                {...form.register("realName")}
                placeholder="Enter real name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                {...form.register("age", { valueAsNumber: true })}
                placeholder="Age"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hometown">Hometown</Label>
              <Input
                id="hometown"
                {...form.register("hometown")}
                placeholder="City, State/Country"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="season">Season</Label>
              <Input
                id="season"
                {...form.register("season")}
                placeholder="e.g. S16, UK4, DU2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="outcome">Outcome</Label>
              <Select onValueChange={(value) => form.setValue("outcome", value)} defaultValue={form.getValues("outcome")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select outcome" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Winner">Winner</SelectItem>
                  <SelectItem value="Runner-up">Runner-up</SelectItem>
                  <SelectItem value="Top 4">Top 4</SelectItem>
                  <SelectItem value="Eliminated">Eliminated</SelectItem>
                  <SelectItem value="Disqualified">Disqualified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="biography">Biography</Label>
            <Textarea
              id="biography"
              {...form.register("biography")}
              rows={4}
              placeholder="Enter contestant biography..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="photoUrl">Photo URL</Label>
            <Input
              id="photoUrl"
              type="url"
              {...form.register("photoUrl")}
              placeholder="https://..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
