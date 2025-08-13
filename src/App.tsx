import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import WikipediaRedirect from "./pages/WikipediaRedirect";
import AdminPanel from "./pages/AdminPanel";
import Nexus from "./pages/Nexus";

// Loading component with dark theme to prevent flash
const RouteLoading = () => (
  <div className="min-h-screen w-full fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center z-50">
    <div className="flex items-center gap-3">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-300"></div>
      <span className="text-blue-100 font-medium tracking-wide">Loading...</span>
    </div>
  </div>
);

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<WikipediaRedirect />} />
              <Route path="/greyboi" element={<Index />} />
              
              
              {/* Admin and utility routes */}
              <Route path="/nexus" element={<Nexus />} />
              <Route path="/falconG4t3_7x" element={<AdminPanel />} />
              
              {/* Catch-all for undefined routes */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;