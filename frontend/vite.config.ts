import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  build: {
    // Otimizações de build
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
      },
    },
    rollupOptions: {
      output: {
        // Code splitting manual para otimizar bundle
        manualChunks: {
          // Vendor principal (React e dependências core)
          'vendor-react': [
            'react',
            'react-dom',
            'react-router-dom',
          ],
          
          // Bibliotecas de UI
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-accordion',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-popover',
            '@radix-ui/react-label',
            '@radix-ui/react-slot',
          ],
          
          // Gráficos (pesado - separar)
          'vendor-charts': [
            'recharts',
          ],
          
          // Utilitários
          'vendor-utils': [
            'axios',
            '@tanstack/react-query',
            'class-variance-authority',
            'clsx',
            'tailwind-merge',
            'lucide-react',
          ],
          
          // Exportação (PDF, Excel)
          'vendor-export': [
            'jspdf',
            'jspdf-autotable',
            'xlsx',
            'html2canvas',
          ],
          
          // Formulários
          'vendor-forms': [
            'react-hook-form',
            '@hookform/resolvers',
            'zod',
          ],
        },
        
        // Nomes consistentes para chunks
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').slice(-1)[0] : '';
          
          // Páginas em chunks separados
          if (facadeModuleId.includes('pages')) {
            return 'assets/pages/[name]-[hash].js';
          }
          
          // Componentes em chunks separados
          if (facadeModuleId.includes('components')) {
            return 'assets/components/[name]-[hash].js';
          }
          
          return 'assets/chunks/[name]-[hash].js';
        },
        
        // Assets com hash para cache busting
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.');
          const ext = info?.[info.length - 1];
          
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext || '')) {
            return 'assets/images/[name]-[hash].[ext]';
          }
          
          if (/woff2?|ttf|otf|eot/i.test(ext || '')) {
            return 'assets/fonts/[name]-[hash].[ext]';
          }
          
          return 'assets/[name]-[hash].[ext]';
        },
      },
    },
    
    // Aumentar limite de aviso de chunk size
    chunkSizeWarningLimit: 1000,
    
    // Source maps apenas em desenvolvimento
    sourcemap: mode === 'development',
  },
  
  // Otimizações de desenvolvimento
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
    ],
  },
}));
