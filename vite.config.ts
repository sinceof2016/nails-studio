import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        output: {
          entryFileNames: 'assets/app.js',
          chunkFileNames: 'assets/[name].js',
          assetFileNames: 'assets/[name].[ext]',
          // Librerías que casi no cambian en archivos aparte: el navegador las guarda y las visitas siguientes bajan menos
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('/@firebase/firestore') || id.includes('/firebase/firestore')) return 'vendor-firestore';
            if (id.includes('/@firebase/auth') || id.includes('/firebase/auth')) return 'vendor-auth';
            if (id.includes('/firebase/') || id.includes('/@firebase/')) return 'vendor-firebase';
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) return 'vendor-react';
            return undefined;
          }
        }
      }
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
