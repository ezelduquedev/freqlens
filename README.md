# FreqLens

> Aplicación web de análisis y procesamiento de audio en tiempo real mediante Web Audio API

![Version](https://img.shields.io/badge/version-1.0.0-orange)
![Build](https://img.shields.io/badge/build-passing-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![React](https://img.shields.io/badge/React-19-61dafb)
![License](https://img.shields.io/badge/license-MIT-green)

FreqLens es una PWA de análisis de audio que corre íntegramente en el navegador, sin
backend, sin instalación y sin coste. Captura audio desde el micrófono del dispositivo
y proporciona herramientas de análisis y procesamiento de señal en tiempo real.

---

## Características principales

- **Analizador espectral** — FFT en tiempo real a 60 fps con escala logarítmica, peak hold y métricas RMS/dBFS
- **Afinador cromático** — Algoritmo YIN ejecutado en AudioWorkletProcessor, precisión sub-centésima
- **Ecualizador adaptativo** — Cadena de 5 BiquadFilterNodes con presets, simulador predictivo de triple curva y asesor acústico
- **Calibración acústica** — Prototipo con ruido rosa (Voss-McCartney) y sine sweep logarítmico
- **Guías de calibración** — Indicadores ghost en faders EQ y botón OPTIMIZAR SALA
- **PWA instalable** — Funciona offline, instalable desde el navegador sin app store

---

## Stack tecnológico

| Tecnología | Versión | Rol |
|---|---|---|
| React | 19.2.4 | Framework UI |
| TypeScript | 5.9.3 | Tipado estático |
| Vite | 8.0.1 | Bundler y dev server |
| Tailwind CSS | v4.2.2 | Sistema de estilos |
| Web Audio API | Nativa | Motor DSP |
| Canvas 2D | Nativa | Visualizadores |
| AudioWorklet | Nativa | Procesamiento en hilo de audio |

---

## Instalación y uso

```bash
# Clonar el repositorio
git clone https://github.com/ezelduquedev/freqlens.git
cd freqlens

# Instalar dependencias
npm install

# Iniciar en desarrollo
npm run dev

# Build de producción
npm run build
```

> **Requisito:** El navegador debe servir la app bajo HTTPS o `localhost` para que
> `getUserMedia` tenga acceso al micrófono.

---

## Estructura del proyecto
src/
├── core/
│   ├── audio/          # AudioManager, AdaptiveEQManager, CalibrationService
│   ├── dsp/            # YinDSP, PitchService
│   └── db/             # StorageManager (IndexedDB)
├── features/
│   ├── analyzer/       # ProfessionalSpectrum
│   ├── tuner/          # ProfessionalTuner
│   ├── eq/             # EQVisualizer, EQPresets, AdaptiveEQControls
│   ├── calibrate/      # EQCalibration
│   └── dashboard/      # DashboardPage
├── layouts/            # AppShell, Sidebar, Topbar
├── styles/             # tokens.css, theme.css, animations.css
└── hooks/              # useAudio y hooks de estado

---

## Módulos

### Analizador espectral
Renderizado Canvas 2D sincronizado con `requestAnimationFrame`. Espectro de barras
con escala logarítmica (20 Hz – 20 kHz), peak hold con decaimiento configurable
y métricas RMS / nivel de pico en dBFS en tiempo real.

### Afinador cromático
Implementación del algoritmo YIN (De Cheveigné & Kawahara, 2002) en un
`AudioWorkletProcessor` independiente del hilo principal. Presenta nota, octava
y desviación en cents mediante un medidor semicircular.

### Ecualizador adaptativo
Cadena HPF → LowShelf → 2× Peaking → HighShelf. El visualizador renderiza
tres curvas superpuestas: sala sin corregir (rojo), filtro activo (naranja) y
espectro resultante predicho (cian). El Asesor Acústico calcula un índice de
Precisión de Compensación Acústica (0–100 %) con valoración automática:
`COMPENSADO` / `ACEPTABLE` / `COLORACIÓN` / `DESFAVORABLE`.

### Calibración acústica
Prototipo experimental. Genera ruido rosa mediante el algoritmo Voss-McCartney
(7 generadores) y sine sweep logarítmico 20 Hz → 20 kHz. Los perfiles de sala
calibrados se persisten en IndexedDB.

---

## Build de producción
Bundle: 347 KB JS + 71 KB CSS
Gzip:   ~117 KB
Errores TypeScript: 0

---

## Compatibilidad

| Navegador | Soporte |
|---|---|
| Chrome 124+ | ✅ Completo |
| Edge 124+ | ✅ Completo |
| Firefox 125+ | ✅ Completo |
| Safari 17+ (iOS) | ⚠️ Parcial — calibración requiere interacción previa |

---

## Referencias académicas

- De Cheveigné, A., & Kawahara, H. (2002). *YIN, a fundamental frequency estimator
  for speech and music.* JASA, 111(4), 1917–1930.
- Voss, R. F., & Clarke, J. (1978). *'1/f noise' in music.* JASA, 63(1), 258–263.
- Smith, J. O. (2007). *Introduction to Digital Filters with Audio Applications.* W3K Publishing.
- Zölzer, U. (2011). *DAFX: Digital Audio Effects* (2nd ed.). Wiley.

---

## Autor

**Ezel Alexander Duque Arias**  
Ciclo: 2º Desarrollo de Aplicaciones Multiplataforma (DAM) · 2026  
TFG — Informe Técnico Final

---

*FreqLens · DAM 2026 · Desplegado en Vercel*
