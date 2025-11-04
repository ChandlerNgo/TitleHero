import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default ({ mode }: { mode: string }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const target = env.VITE_API_TARGET || 'https://5mj0m92f17.execute-api.us-east-2.amazonaws.com/'

  return defineConfig({
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
}
