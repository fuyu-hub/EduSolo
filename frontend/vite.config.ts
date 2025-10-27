import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/",
  server: {
    host: "::",
    port: 8080,
    historyApiFallback: true,
  },
  preview: {
    port: 8080,
    host: "::",
    historyApiFallback: true,
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'edusolo - logo.svg', 'edusolo - logo.png', 'robots.txt'],
      manifest: {
        name: 'EduSolo - Ferramentas de Mecânica dos Solos',
        short_name: 'EduSolo',
        description: 'Suíte completa de ferramentas educacionais para análise geotécnica: cálculo de índices físicos, granulometria, compactação, tensões geostáticas e muito mais. Perfeito para estudantes e engenheiros civis.',
        theme_color: '#B97A4C',
        background_color: '#1A1F2E',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui', 'browser'],
        scope: '/',
        start_url: '/?source=pwa',
        orientation: 'any',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        screenshots: [
          {
            src: '/screenshots/screenshot-1.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Dashboard principal com todos os módulos'
          },
          {
            src: '/screenshots/screenshot-2.png',
            sizes: '750x1334',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Cálculo de Índices Físicos'
          }
        ],
        shortcuts: [
          {
            name: 'Índices Físicos',
            short_name: 'Índices',
            description: 'Calcular índices físicos do solo',
            url: '/indices-fisicos?source=shortcut',
            icons: [
              {
                src: '/icons/indices-fisicos-96x96.png',
                sizes: '96x96',
                type: 'image/png'
              }
            ]
          },
          {
            name: 'Granulometria',
            short_name: 'Granulo',
            description: 'Análise granulométrica e classificação',
            url: '/granulometria?source=shortcut',
            icons: [
              {
                src: '/icons/granulometria-96x96.png',
                sizes: '96x96',
                type: 'image/png'
              }
            ]
          },
          {
            name: 'Compactação',
            short_name: 'Compacta',
            description: 'Curvas de compactação',
            url: '/compactacao?source=shortcut',
            icons: [
              {
                src: '/icons/compactacao-96x96.png',
                sizes: '96x96',
                type: 'image/png'
              }
            ]
          },
          {
            name: 'Tensões',
            short_name: 'Tensões',
            description: 'Tensões geostáticas',
            url: '/tensoes?source=shortcut',
            icons: [
              {
                src: '/icons/tensoes-96x96.png',
                sizes: '96x96',
                type: 'image/png'
              }
            ]
          }
        ],
        categories: ['education', 'productivity', 'utilities'],
        lang: 'pt-BR',
        dir: 'ltr',
        prefer_related_applications: false
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 ano
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 ano
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 ano
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutos
              },
              networkTimeoutSeconds: 10
            }
          },
          {
            urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 dias
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        // Precache todas as rotas principais
        additionalManifestEntries: [
          { url: '/', revision: null },
          { url: '/indices-fisicos', revision: null },
          { url: '/limites-consistencia', revision: null },
          { url: '/granulometria', revision: null },
          { url: '/compactacao', revision: null },
          { url: '/tensoes', revision: null },
          { url: '/acrescimo-tensoes', revision: null },
          { url: '/settings', revision: null },
          { url: '/salvos', revision: null },
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ].filter(Boolean),
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
