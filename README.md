# Crystalline

An immersive, web-based audio experience designed for focus and atmosphere.

## Overview

Crystalline combines high-fidelity audio playback with generative visuals to create a serene digital environment. It creates a cohesive sensory experience through fluid WebGL backgrounds and precise audio visualization.

## Features

- **Atmospheric Visuals**: Real-time, generative WebGL background effects powered by OGL (`DarkVeil`).
- **Interactive Waveform**: Precision audio visualization and navigation using `wavesurfer.js`.
- **Seamless Experience**: Global audio state management ensuring uninterrupted playback across navigation.
- **Performance First**: Optimized build with Astro, manual chunking, and asset preloading.

## Tech Stack

- **Framework**: [Astro](https://astro.build)
- **UI Library**: [React](https://react.dev)
- **Styling**: [UnoCSS](https://unocss.dev) (Tailwind-compatible)
- **Audio**: [WaveSurfer.js](https://wavesurfer-js.org/)
- **Graphics**: [OGL](https://github.com/oframe/ogl) (Minimal WebGL library)

## Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- pnpm

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Visit `http://localhost:4321` to view the application.

### Build

```bash
pnpm build
```

## License

MIT
