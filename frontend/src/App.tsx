import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import IndicesFisicos from "./pages/IndicesFisicos";
import Compactacao from "./pages/Compactacao";
import Tensoes from "./pages/Tensoes";
import Educacional from "./pages/Educacional";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route
            path="/indices-fisicos"
            element={
              <Layout>
                <IndicesFisicos />
              </Layout>
            }
          />
          <Route
            path="/compactacao"
            element={
              <Layout>
                <Compactacao />
              </Layout>
            }
          />
          <Route
            path="/tensoes"
            element={
              <Layout>
                <Tensoes />
              </Layout>
            }
          />
          <Route
            path="/educacional"
            element={
              <Layout>
                <Educacional />
              </Layout>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
