import { Users, Calendar, Globe, Images } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AppStats } from "@shared/schema";

interface StatsCardsProps {
  stats?: AppStats;
  isLoading?: boolean;
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Contestants",
      value: stats?.contestants || 0,
      icon: Users,
      gradient: "bg-gradient-to-br from-blue-500 to-blue-600",
      textGradient: "bg-gradient-to-r from-blue-600 to-blue-500",
    },
    {
      title: "Seasons Scraped",
      value: stats?.seasons || 0,
      icon: Calendar,
      gradient: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      textGradient: "bg-gradient-to-r from-emerald-600 to-emerald-500",
    },
    {
      title: "Franchises",
      value: stats?.franchises || 0,
      icon: Globe,
      gradient: "bg-gradient-to-br from-purple-500 to-purple-600",
      textGradient: "bg-gradient-to-r from-purple-600 to-purple-500",
    },
    {
      title: "Photos Collected",
      value: stats?.photos || 0,
      icon: Images,
      gradient: "bg-gradient-to-br from-orange-500 to-orange-600",
      textGradient: "bg-gradient-to-r from-orange-600 to-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="card-enhanced">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`p-3 ${card.gradient} rounded-xl shadow-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <p className={`text-3xl font-bold ${card.textGradient} bg-clip-text text-transparent`}>
                    {isLoading ? "..." : card.value.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
