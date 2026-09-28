import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Never silently fall back to 5174 — Google OAuth authorized origin and
    // backend CORS_ORIGINS are both pinned to http://localhost:5173.
    strictPort: true,
  },
})
