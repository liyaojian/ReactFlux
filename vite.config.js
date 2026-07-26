import path from "node:path"
import { fileURLToPath } from "node:url"

import viteReact from "@vitejs/plugin-react"
// import {visualizer} from "rollup-plugin-visualizer"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

const { dirname, resolve } = path
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const ReactCompilerConfig = { target: "18" }

export default defineConfig({
  plugins: [
    viteReact({
      babel: {
        plugins: [["babel-plugin-react-compiler", ReactCompilerConfig]],
      },
    }),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        id: "/",
        name: "ReactFlux",
        short_name: "ReactFlux",
        description: "A Simple but Powerful RSS Reader for Miniflux",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#1F2327",
        icons: [
          {
            src: "/favicon.ico",
            sizes: "64x64",
            type: "image/x-icon",
          },
          {
            src: "/logo192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/logo512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
      workbox: {
        skipWaiting: true,
      },
    }),
    // visualizer({
    //   gzipSize: true,
    // }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
  preview: {
    host: "0.0.0.0",
    port: 3000,
  },
  build: {
    outDir: "build",
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          arco: ["@arco-design/web-react"],
          highlight: ["highlight.js"],
          react: ["react", "react-dom", "react-router"],
        },
      },
    },
  },
})
