import { defineConfig,presetIcons, presetWind4 } from "unocss";

export default defineConfig({
  presets: [
    presetWind4(),
    presetIcons({
      collections: {
        carbon: () => import('@iconify-json/carbon/icons.json').then(i => i.default),
      },
    }),
  ],
  theme: {
    animation: {
      keyframes: {
        'fade-in-up': '{ from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }',
        'fade-in': '{ from { opacity: 0; } to { opacity: 1; } }',
      },
      durations: {
        'fade-in-up': '0.8s',
        'fade-in': '1s',
      },
      timingFns: {
        'fade-in-up': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        'fade-in': 'ease-in-out',
      },
    },
  },
});
