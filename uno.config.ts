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
});
