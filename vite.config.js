import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Em desenvolvimento, /api/grok é redirecionado direto para a xAI
      '/api/grok': {
        target: 'https://api.x.ai',
        changeOrigin: true,
        rewrite: () => '/v1/chat/completions',
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            const key = process.env.VITE_GROK_API_KEY
            if (key) proxyReq.setHeader('Authorization', `Bearer ${key}`)
          })
        },
      },
    },
  },
})
