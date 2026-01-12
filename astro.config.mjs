import { defineConfig } from "astro/config";
import UnoCSS from "unocss/astro";
import react from "@astrojs/react";

export default defineConfig({
  prefetch: true,
  integrations: [
    UnoCSS({
      injectReset: true,
    }),
    react(
      {
        experimentalReactChildren: true,
      }
    ),
  ],
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'libs': ['ogl', 'wavesurfer.js'],
            'ui-libs': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-popover',
              '@radix-ui/react-select',
              '@radix-ui/react-slider',
              '@radix-ui/react-slot'
            ]
          }
        }
      }
    }
  }
});
