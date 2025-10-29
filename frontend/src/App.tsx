import { lazy, Suspense, useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { PageLoader } from "@/components/ui/loading-spinner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { TourProvider } from "@/contexts/TourContext";
import { Tour } from "@/components/Tour";
import { PWAUpdateNotification } from "@/components/PWAUpdateNotification";
import { useRoutePreload } from "@/hooks/use-route-preload";
import { ToursProvider } from "@/components/WelcomeDialog";

// Lazy loading de páginas para melhor performance
// Páginas principais (carregamento imediato)
import NotFound from "./pages/NotFound";

// Páginas de cálculo (lazy loading)
const IndicesFisicos = lazy(() => import("./pages/IndicesFisicos"));
const LimitesConsistencia = lazy(() => import("./pages/LimitesConsistencia"));
const Granulometria = lazy(() => import("./pages/Granulometria"));
const Compactacao = lazy(() => import("./pages/Compactacao"));
const TensoesGeostaticas = lazy(() => import("./pages/TensoesGeostaticas"));
const AcrescimoTensoes = lazy(() => import("./pages/AcrescimoTensoes"));

// Páginas de Acréscimo de Tensões (lazy loading)
const Boussinesq = lazy(() => import("./pages/acrescimo-tensoes/Boussinesq"));
const Love = lazy(() => import("./pages/acrescimo-tensoes/Love"));
const Carothers = lazy(() => import("./pages/acrescimo-tensoes/Carothers"));
const Newmark = lazy(() => import("./pages/acrescimo-tensoes/Newmark"));

// Páginas auxiliares (lazy loading)
const Educacional = lazy(() => import("./pages/Educacional"));
const Settings = lazy(() => import("./pages/Settings"));
const About = lazy(() => import("./pages/About"));
const PlanosFuturos = lazy(() => import("./pages/PlanosFuturos"));
const Salvos = lazy(() => import("./pages/Salvos"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const Dashboard = lazy(() => import("./pages/Dashboard"));

// Componente interno para preload
const AppContent = () => {
  // Preload das rotas mais acessadas após 2 segundos de idle
  useRoutePreload({
    routes: {
      indicesFisicos: () => import("./pages/IndicesFisicos"),
      granulometria: () => import("./pages/Granulometria"),
      compactacao: () => import("./pages/Compactacao"),
      tensoes: () => import("./pages/TensoesGeostaticas"),
    },
    delay: 2000,
    onIdle: true,
  });

  // Preload de rotas secundárias após 5 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      import("./pages/LimitesConsistencia");
      import("./pages/AcrescimoTensoes");
      import("./pages/Settings");
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Rota principal - Home como Dashboard */}
        <Route
          path="/"
          element={
            <Layout>
              <Suspense fallback={<PageLoader />}>
                <Dashboard />
              </Suspense>
            </Layout>
          }
        />
        {/* Alias para Dashboard */}
        <Route
          path="/modulos"
          element={<Navigate to="/dashboard" replace />}
        />
        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <Layout>
              <Suspense fallback={<PageLoader />}>
                <Dashboard />
              </Suspense>
            </Layout>
          }
        />
        
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
        <Route
          path="/acrescimo-tensoes/boussinesq"
          element={
            <Layout>
              <Suspense fallback={<PageLoader />}>
                <Boussinesq />
              </Suspense>
            </Layout>
          }
        />
        <Route
          path="/acrescimo-tensoes/love"
          element={
            <Layout>
              <Suspense fallback={<PageLoader />}>
                <Love />
              </Suspense>
            </Layout>
          }
        />
        <Route
          path="/acrescimo-tensoes/carothers"
          element={
            <Layout>
              <Suspense fallback={<PageLoader />}>
                <Carothers />
              </Suspense>
            </Layout>
          }
        />
        <Route
          path="/acrescimo-tensoes/newmark"
          element={
            <Layout>
              <Suspense fallback={<PageLoader />}>
                <Newmark />
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
        <Route
          path="/planos-futuros"
          element={
            <Layout>
              <Suspense fallback={<PageLoader />}>
                <PlanosFuturos />
              </Suspense>
            </Layout>
          }
        />
        <Route
          path="/salvos"
          element={
            <Layout>
              <Suspense fallback={<PageLoader />}>
                <Salvos />
              </Suspense>
            </Layout>
          }
        />
        <Route
          path="/relatorios"
          element={
            <Layout>
              <Suspense fallback={<PageLoader />}>
                <Relatorios />
              </Suspense>
            </Layout>
          }
        />

        
        
        {/* Rota 404 - sem lazy loading */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <ErrorBoundary>
    <SettingsProvider>
      <ThemeProvider>
        <TourProvider>
          <ToursProvider>
            <TooltipProvider>
              <Sonner />
              <Tour />
              <PWAUpdateNotification />
              <BrowserRouter>
                <AppContent />
              </BrowserRouter>
            </TooltipProvider>
          </ToursProvider>
        </TourProvider>
      </ThemeProvider>
    </SettingsProvider>
  </ErrorBoundary>
);

export default App;
