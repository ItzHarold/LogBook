import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy /api calls to the Vercel dev server (port 3000)
    // when running `vercel dev` alongside `npm run dev`
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
