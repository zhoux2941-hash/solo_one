import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
  plugins: [react(), mkcert()],
  server: {
    https: true,
    port: 3000,
    proxy: {
      '/webtransport': {
        target: 'https://localhost:3001',
        ws: false,
        changeOrigin: true,
        secure: false
      }
    }
  }
})
