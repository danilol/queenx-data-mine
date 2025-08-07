import { Link, useLocation } from "wouter";
import { Crown, Gauge, Worm, Users, Calendar, Download, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const navigation = [
  { name: "Dashboard", href: "/", icon: Gauge, active: true },
  { name: "Scraper", href: "/scraper", icon: Worm },
  { name: "Contestants", href: "/contestants", icon: Users },
  { name: "Seasons", href: "/seasons", icon: Calendar },
  { name: "Export Data", href: "/export", icon: Download },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: () => api.getStats(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <aside className="w-64 bg-card shadow-lg border-r flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 gradient-crown rounded-lg flex items-center justify-center">
            <Crown className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-card-foreground">Drag Race CMS</h1>
            <p className="text-xs text-muted-foreground">Data Scraper & Manager</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href || (item.href === "/" && location === "");
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Stats Footer */}
      <div className="p-4 border-t bg-card">
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Total Records:</span>
            <span className="font-semibold text-card-foreground">
              {stats ? stats.contestants.toLocaleString() : "Loading..."}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Last Sync:</span>
            <span className="font-semibold text-card-foreground">
              {stats?.lastSync || "Never"}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
