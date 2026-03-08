import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // API requests (/v1/*) go to the backend; ensure backend runs on this port (default 3000)
      '/v1': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
