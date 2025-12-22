import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SearchProvider } from "@/contexts/SearchContext";
import { FullScreenLoader } from "@/components/ui/FullScreenLoader";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Sent from "./pages/Sent";
import Drafts from "./pages/Drafts";
import Trash from "./pages/Trash";
import SharedFiles from "./pages/SharedFiles";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const { loading } = useAuth();

  if (loading) {
    return <FullScreenLoader />;
  }

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/sent" element={<Sent />} />
        <Route path="/drafts" element={<Drafts />} />
        <Route path="/trash" element={<Trash />} />
        <Route path="/shared-files" element={<SharedFiles />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SearchProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </TooltipProvider>
      </SearchProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
