import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(".", "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5050',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:5050',
        ws: true,
      },
    },
  },
})
