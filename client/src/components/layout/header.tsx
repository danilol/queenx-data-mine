import { Button } from "@/components/ui/button";
import { Play, RotateCcw } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  title: string;
  subtitle: string;
  showScrapingButtons?: boolean;
}

export function Header({ title, subtitle, showScrapingButtons = false }: HeaderProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const startScrapingMutation = useMutation({
    mutationFn: () => api.startScraping({ headless: false, screenshotsEnabled: true }),
    onSuccess: () => {
      toast({
        title: "Scraping Started",
        description: "Web scraping has begun. You can monitor progress in real-time.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/scraping/status"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Start Scraping",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      await queryClient.invalidateQueries();
    },
    onSuccess: () => {
      toast({
        title: "Data Refreshed",
        description: "All data has been refreshed successfully.",
      });
    },
  });

  return (
    <header className="bg-card/30 backdrop-blur-xl border-b border-border/30 p-6 sticky top-0 z-20">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">{title}</h2>
          <p className="text-muted-foreground mt-2 text-sm">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {showScrapingButtons && (
            <Button
              onClick={() => startScrapingMutation.mutate()}
              disabled={startScrapingMutation.isPending}
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-lg transition-all duration-200"
            >
              <Play className="h-4 w-4 mr-2" />
              {startScrapingMutation.isPending ? "Starting..." : "Start Scraping"}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {refreshMutation.isPending ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>
    </header>
  );
}
