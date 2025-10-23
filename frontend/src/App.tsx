import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import IndicesFisicos from "./pages/IndicesFisicos";
import LimitesConsistencia from "./pages/LimitesConsistencia";
import Granulometria from "./pages/Granulometria";
import Compactacao from "./pages/Compactacao";
import Tensoes from "./pages/Tensoes";
import AcrescimoTensoes from "./pages/AcrescimoTensoes";
import Educacional from "./pages/Educacional";
import Settings from "./pages/Settings";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SettingsProvider } from "@/contexts/SettingsContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SettingsProvider>
      <ThemeProvider>
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
              path="/limites-consistencia"
              element={
                <Layout>
                  <LimitesConsistencia />
                </Layout>
              }
            />
            <Route
              path="/granulometria"
              element={
                <Layout>
                  <Granulometria />
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
              path="/acrescimo-tensoes"
              element={
                <Layout>
                  <AcrescimoTensoes />
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
            <Route
              path="/settings"
              element={
                <Layout>
                  <Settings />
                </Layout>
              }
            />
            <Route
              path="/about"
              element={
                <Layout>
                  <About />
                </Layout>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
    </SettingsProvider>
  </QueryClientProvider>
);

export default App;
