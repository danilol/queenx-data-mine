import { Link, Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { LayoutDashboard, Bot, Users, Download, Globe, Tv } from "lucide-react";

import Dashboard from "@/pages/dashboard";
import Scraper from "@/pages/scraper";
import Contestants from "@/pages/contestants";
import Export from "@/pages/export";
import Franchises from "@/pages/franchises";
import Seasons from "@/pages/seasons";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/scraper" component={Scraper} />
      <Route path="/contestants" component={Contestants} />
      <Route path="/export" component={Export} />
      <Route path="/franchises" component={Franchises} />
      <Route path="/seasons" component={Seasons} />
      <Route component={NotFound} />
    </Switch>
  );
}

const navigationItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/scraper", label: "Scraper", icon: Bot },
  { path: "/franchises", label: "Franchises", icon: Globe },
  { path: "/seasons", label: "Seasons", icon: Tv },
  { path: "/contestants", label: "Contestants", icon: Users },
  { path: "/export", label: "Export", icon: Download }
];

function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="flex flex-col gap-1">
      {navigationItems.map(({ path, label, icon: Icon }) => (
        <Link
          key={path}
          to={path}
          className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group ${
            location === path 
              ? "bg-replit-accent text-replit-accent-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          }`}
        >
          <Icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${
            location === path ? "text-replit-accent-foreground" : ""
          }`} />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="drag-data-theme">
        <TooltipProvider>
          <div className="flex min-h-screen w-full bg-background">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r border-border bg-card/50 backdrop-blur-sm sm:flex">
              <div className="flex h-16 items-center border-b border-border px-6">
                <Link to="/" className="flex items-center gap-3 font-semibold text-foreground hover:text-replit-accent transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-replit-accent flex items-center justify-center shadow-sm">
                    <Bot className="w-4 h-4 text-replit-accent-foreground" />
                  </div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                    Drag Data Mine
                  </h1>
                </Link>
              </div>
              <div className="flex-1 overflow-auto p-2">
                <Navigation />
              </div>
            </aside>

            {/* Mobile Header */}
            <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:hidden">
              <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
                <div className="w-7 h-7 rounded-lg bg-replit-accent flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-replit-accent-foreground" />
                </div>
                <h1 className="text-lg font-bold">Drag Data Mine</h1>
              </Link>
              <ThemeToggle />
            </header>

            {/* Main Content */}
            <div className="flex flex-1 flex-col sm:pl-64">
              <header className="sticky top-0 z-30 hidden h-16 items-center justify-end gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 sm:flex">
                <ThemeToggle />
              </header>
              <main className="flex-1 overflow-auto p-4 sm:p-6">
                <div className="mx-auto max-w-7xl">
                  <Router />
                </div>
              </main>
            </div>
          </div>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
