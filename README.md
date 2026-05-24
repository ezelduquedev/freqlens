# FreqLens

**FreqLens** – a premium, web‑based real‑time audio analysis and calibration suite for studio monitoring and room correction. Built with React, Vite, Tailwind‑inspired utilities, and Web Audio API.

---

## ✨ Features

- **Real‑time Spectrum Analyzer** – high‑performance canvas visualisation with 30 FPS throttling for low CPU usage.
- **Room Calibration** – automatic impulse response measurement, EQ recommendation engine (±4 dB conservative gains).
- **Professional UI** – glass‑morphism panels, dark/light mode, animated neon accents.
- **PWA Ready** – works offline, no data leaves the browser.
- **Extensible Architecture** – modular components under `src/components`, audio logic under `src/core/audio`.

---

## 🛠️ Installation

```bash
# Clone the repo
git clone https://github.com/ezelduquedev/freqlens.git
cd freqlens

# Install dependencies (Node 20+ required)
npm ci

# Run the development server
npm run dev
```

The app will be available at `http://localhost:5175` (or the port printed in the console).

---

## 📦 Build for Production

```bash
npm run build
# Deploy the contents of the `dist/` folder to any static‑host (Netlify, Vercel, GitHub Pages, etc.)
```

---

## 🧩 Project Structure

```
src/
├─ components/          # Re‑usable UI components
│   ├─ GlassPanel/      # Panel with glass‑morphism effect
│   ├─ Button/          # Styled button component
│   └─ …
├─ features/            # Feature‑level pages
│   ├─ dashboard/       # Landing page and surrounding sections
│   ├─ calibrate/       # Calibration workflow
│   ├─ eq/              # EQ presets and recommendation engine UI
│   └─ analyzer/        # Spectrum visualiser
├─ core/
│   └─ audio/           # Web Audio API helpers, DSP logic
├─ ui/                  # Low‑level primitives (icons, utilities)
├─ index.css            # Global CSS + design tokens
├─ App.tsx              # Router and global layout
└─ main.tsx             # Vite entry point
```

---

## 📚 Documentation

All detailed design notes and testing logs are kept in the `docs/` folder of the repository (see the *TFG* thesis documents).

---

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/awesome‑feature`).
3. Ensure the app builds and passes linting (`npm run lint`).
4. Open a Pull Request describing your changes.

---

## © License

MIT License – feel free to use, modify, and distribute.
