import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
    compress: 'gzip',
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', 'three-stdlib']
        }
      }
    }
  }
})
