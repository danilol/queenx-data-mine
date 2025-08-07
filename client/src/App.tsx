import { Link, Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme-toggle";

import Dashboard from "@/pages/dashboard";
import Scraper from "@/pages/scraper";
import Contestants from "@/pages/contestants";
import Export from "@/pages/export";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/scraper" component={Scraper} />
      <Route path="/contestants" component={Contestants} />
      <Route path="/export" component={Export} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex min-h-screen w-full flex-col bg-background">
          <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
            <div className="flex h-16 items-center border-b px-6">
              <Link to="/" className="flex items-center gap-2 font-semibold">
                <h1 className="text-2xl font-bold">Drag Data Mine</h1>
              </Link>
            </div>
            <nav className="flex flex-col p-6 text-lg font-medium">
              <Link to="/" className="p-2 rounded hover:bg-accent">Dashboard</Link>
              <Link to="/scraper" className="p-2 rounded hover:bg-accent">Scraper</Link>
              <Link to="/contestants" className="p-2 rounded hover:bg-accent">Contestants</Link>
              <Link to="/export" className="p-2 rounded hover:bg-accent">Export</Link>
            </nav>
          </aside>
          <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-72">
            <header className="sticky top-0 z-30 flex h-14 items-center justify-end gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
              <ThemeToggle />
            </header>
            <main className="flex-1 p-8">
              <Router />
            </main>
          </div>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
