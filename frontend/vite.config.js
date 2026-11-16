import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${process.env.VITE_API_PORT || process.env.PORT || 5001}`,
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, res) => {
            console.warn(`[Vite Proxy] Warning: Could not reach Flask backend on port ${process.env.VITE_API_PORT || process.env.PORT || 5001}. Ensure backend server is running.`);
            if (res && !res.headersSent && typeof res.writeHead === 'function') {
              res.writeHead(502, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: 'Bad Gateway',
                status: 502,
                message: 'Flask backend is offline or unreachable on port 5001. Please ensure Python Flask is running.'
              }));
            }
          });
        },
      },
    },
  },
})
