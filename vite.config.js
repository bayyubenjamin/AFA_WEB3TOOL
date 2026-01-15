import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Menggunakan path.resolve untuk konsistensi cross-platform
      '@': path.resolve(__dirname, './src'),
      'tsparticles/all': path.resolve(__dirname, 'node_modules/@tsparticles/all'),
    },
  },
  build: {
    // Optimasi output build untuk production
    outDir: 'dist',
    sourcemap: false, // Matikan sourcemap di prod untuk keamanan & ukuran
    rollupOptions: {
      output: {
        // Code Splitting: Memisahkan vendor (node_modules) dari kode aplikasi utama
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Memisahkan library besar ke chunk tersendiri
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('supabase')) {
              return 'vendor-supabase';
            }
            return 'vendor'; // Sisa library lainnya
          }
        },
      },
    },
    // Menghindari warning chunk size kecuali benar-benar besar (>1MB)
    chunkSizeWarningLimit: 1000,
  },
})