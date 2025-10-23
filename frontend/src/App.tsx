import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { PageLoader } from "@/components/ui/loading-spinner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SettingsProvider } from "@/contexts/SettingsContext";

// Lazy loading de páginas para melhor performance
// Páginas principais (carregamento imediato)
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Páginas de cálculo (lazy loading)
const IndicesFisicos = lazy(() => import("./pages/IndicesFisicos"));
const LimitesConsistencia = lazy(() => import("./pages/LimitesConsistencia"));
const Granulometria = lazy(() => import("./pages/Granulometria"));
const Compactacao = lazy(() => import("./pages/Compactacao"));
const TensoesGeostaticas = lazy(() => import("./pages/TensoesGeostaticas"));
const AcrescimoTensoes = lazy(() => import("./pages/AcrescimoTensoes"));

// Páginas auxiliares (lazy loading)
const Educacional = lazy(() => import("./pages/Educacional"));
const Settings = lazy(() => import("./pages/Settings"));
const About = lazy(() => import("./pages/About"));

// Configurar QueryClient com otimizações
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Rota principal - sem lazy loading */}
                <Route path="/" element={<Index />} />
                
                {/* Rotas de cálculo - com lazy loading */}
                <Route
                  path="/indices-fisicos"
                  element={
                    <Layout>
                      <Suspense fallback={<PageLoader />}>
                        <IndicesFisicos />
                      </Suspense>
                    </Layout>
                  }
                />
                <Route
                  path="/limites-consistencia"
                  element={
                    <Layout>
                      <Suspense fallback={<PageLoader />}>
                        <LimitesConsistencia />
                      </Suspense>
                    </Layout>
                  }
                />
                <Route
                  path="/granulometria"
                  element={
                    <Layout>
                      <Suspense fallback={<PageLoader />}>
                        <Granulometria />
                      </Suspense>
                    </Layout>
                  }
                />
                <Route
                  path="/compactacao"
                  element={
                    <Layout>
                      <Suspense fallback={<PageLoader />}>
                        <Compactacao />
                      </Suspense>
                    </Layout>
                  }
                />
                <Route
                  path="/tensoes"
                  element={
                    <Layout>
                      <Suspense fallback={<PageLoader />}>
                        <TensoesGeostaticas />
                      </Suspense>
                    </Layout>
                  }
                />
                <Route
                  path="/acrescimo-tensoes"
                  element={
                    <Layout>
                      <Suspense fallback={<PageLoader />}>
                        <AcrescimoTensoes />
                      </Suspense>
                    </Layout>
                  }
                />
                
                {/* Rotas auxiliares - com lazy loading */}
                <Route
                  path="/educacional"
                  element={
                    <Layout>
                      <Suspense fallback={<PageLoader />}>
                        <Educacional />
                      </Suspense>
                    </Layout>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <Layout>
                      <Suspense fallback={<PageLoader />}>
                        <Settings />
                      </Suspense>
                    </Layout>
                  }
                />
                <Route
                  path="/about"
                  element={
                    <Layout>
                      <Suspense fallback={<PageLoader />}>
                        <About />
                      </Suspense>
                    </Layout>
                  }
                />
                
                {/* Rota 404 - sem lazy loading */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </SettingsProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
