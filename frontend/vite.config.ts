import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Enable code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['lucide-react', 'tailwind-merge', 'clsx'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-utils': ['axios', 'date-fns', 'pako'],
          'vendor-canvas': ['reactflow'],
          'vendor-state': ['zustand'],
          
          // App chunks
          'pages-auth': [
            './src/pages/LoginPage',
            './src/pages/RegisterPage',
            './src/pages/LandingPage'
          ],
          'pages-projects': [
            './src/pages/ProjectsPage',
            './src/pages/ProjectDetailPage',
            './src/pages/NewProjectPage'
          ],
          'pages-phases': [
            './src/pages/PhaseDetailPage',
            './src/pages/ProjectSummaryPage'
          ],
          'pages-diagrams': [
            './src/pages/DiagramWorkspacePage',
            './src/pages/UmlDiagramEditorPage'
          ],
          'components-phases': [
            './src/components/phases/PlanningRoadmapPhase',
            './src/components/phases/FeasibilityStudyPhase',
            './src/components/phases/SystemDesignPhase',
            './src/components/phases/DevelopmentPhase',
            './src/components/phases/ValidationPhase',
            './src/components/phases/DesignPhase',
            './src/components/phases/GanttChartPhase',
            './src/components/phases/FinalSummaryPhase'
          ]
        },
        // Generate readable chunk names
        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.name && chunkInfo.name.startsWith('vendor-')) {
            return `assets/vendor/[name].[hash].js`
          }
          if (chunkInfo.name && chunkInfo.name.startsWith('pages-')) {
            return `assets/pages/[name].[hash].js`
          }
          if (chunkInfo.name && chunkInfo.name.startsWith('components-')) {
            return `assets/components/[name].[hash].js`
          }
          return `assets/[name].[hash].js`
        },
        // Asset naming
        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name?.split('.').pop() || ''
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return `assets/images/[name].[hash][extname]`
          }
          if (/css/i.test(extType)) {
            return `assets/styles/[name].[hash][extname]`
          }
          return `assets/[name].[hash][extname]`
        }
      }
    },
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Enable source maps for production debugging
    sourcemap: true
  },
  // Development server optimization
  server: {
    // Enable HMR
    hmr: {
      overlay: true
    },
    // Optimize dev build
    fs: {
      strict: false
    },
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: [
      '.preview.emergentagent.com',
      '.emergentagent.com',
      'localhost'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
    },
  },
})
