import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'

// Load environment variables from .env if it exists
dotenv.config()

// Set default target if environment variable is not defined
const target = process.env.VITE_API_TARGET || 'https://5mj0m92f17.execute-api.us-east-2.amazonaws.com/'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target,
        changeOrigin: true,
      },
    },
  },
})
