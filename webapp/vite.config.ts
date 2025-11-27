import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // dev convenience if you want to hit proxy server via vite
      '/api': 'http://localhost:3000',
    },
  },
})
