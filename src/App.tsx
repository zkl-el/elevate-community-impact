import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getSession } from "@/lib/auth";
import Index from "./pages/Index";

import Dashboard from "./pages/Dashboard";

import FinanceAdminDashboard from "./pages/FinanceAdminDashboard";
import GuestDashboard from "./pages/GuestDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const session = getSession();
  if (!session) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

// Auth page wrapper - redirects to dashboard if already logged in


const App = () => (
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/finance" element={<FinanceAdminDashboard />} />
            <Route path="/guest-dashboard" element={<GuestDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
);

export default App;
