import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  base: "/",
  build: {
    sourcemap: true,
    assetsDir: "code",
    target: ["esnext"],
    cssMinify: true,
    lib: false
  },
  server: {
    proxy: {
      // Proxy API requests during dev to avoid CORS issues
      '/v1': {
        target: 'https://api.llama.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/v1/, '/v1'),
        // Optionally add headers if needed for the API
        // headers: {
        //   'Authorization': 'Bearer <API_KEY>'
        // }
      }
    }
  },
  plugins: [
    VitePWA({
      strategies: "injectManifest",
      injectManifest: {
        swSrc: 'public/sw.js',
        swDest: 'dist/sw.js',
        globDirectory: 'dist',
        globPatterns: [
          '**/*.{html,js,css,json,png}',
        ],
      },
      injectRegister: false,
      manifest: false,
      devOptions: {
        enabled: true
      }
    })
  ]
})
