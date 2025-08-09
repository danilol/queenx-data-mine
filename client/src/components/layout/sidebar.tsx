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
    <aside className="w-64 glass-card border-r-0 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-border/30">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 gradient-crown rounded-xl flex items-center justify-center shadow-lg">
            <Crown className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">Drag Race CMS</h1>
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
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
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
      <div className="p-4 border-t border-border/30 bg-accent/20">
        <div className="text-xs text-muted-foreground space-y-2">
          <div className="flex justify-between">
            <span>Total Records:</span>
            <span className="font-semibold text-foreground">
              {stats ? stats.contestants.toLocaleString() : "Loading..."}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Last Sync:</span>
            <span className="font-semibold text-foreground">
              {stats?.lastSync || "Never"}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
