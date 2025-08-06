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
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Seasons Scraped",
      value: stats?.seasons || 0,
      icon: Calendar,
      bgColor: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      title: "Franchises",
      value: stats?.franchises || 0,
      icon: Globe,
      bgColor: "bg-amber-100",
      iconColor: "text-amber-600",
    },
    {
      title: "Photos Collected",
      value: stats?.photos || 0,
      icon: Images,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`p-2 ${card.bgColor} rounded-lg`}>
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">
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
