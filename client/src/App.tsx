import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import TalkToUs from "@/pages/talk-to-us";
import DataManagement from "@/pages/data-management";
import Settings from "@/pages/settings";
import AppLayout from "@/components/layout/app-layout";
import ava from "@/pages/ava";

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/pulse" component={Dashboard} />
        <Route path="/pulse" component={Dashboard} />
        <Route path="/talk-to-us" component={TalkToUs} />
        <Route path="/data-management" component={DataManagement} />
        <Route path="/ava" component={ava} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen bg-background text-foreground">
            <Toaster />
            <Router />
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
