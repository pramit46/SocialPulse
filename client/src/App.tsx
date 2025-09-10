import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ErrorBoundary from "@/components/ErrorBoundary";

// Simple test component first
function TestDashboard() {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <h1 className="text-3xl font-bold text-white mb-4">SocialPulse Dashboard</h1>
      <p className="text-gray-400">Application loaded successfully!</p>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-white mb-2">Status</h3>
          <p className="text-green-400">✅ Frontend Working</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-white mb-2">API</h3>
          <p className="text-blue-400">🔗 Checking connections...</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-white mb-2">Database</h3>
          <p className="text-yellow-400">📊 MongoDB Ready</p>
        </div>
      </div>
    </div>
  );
}

function SimpleRouter() {
  return (
    <Switch>
      <Route path="/" component={TestDashboard} />
      <Route path="/pulse" component={TestDashboard} />
      <Route>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Page Not Found</h1>
            <a href="/" className="text-blue-400 hover:text-blue-300">Go Home</a>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <div className="dark">
            <SimpleRouter />
          </div>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
