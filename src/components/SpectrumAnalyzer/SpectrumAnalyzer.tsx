import { useRef, useCallback, useEffect, useState } from 'react'
import { useAnimationFrame } from '../../hooks/useAnimationFrame'
import { binToFreq, dbToY, calcRMS } from '../../utils/audio'

// --- CONSTANTES DE ALTA RESOLUCIÓN ---
const MIN_FREQ = 20;
const MAX_FREQ = 20000;
const MIN_DB = -120; // Rango amplio para evitar "zoom"
const MAX_DB = 10;

type EQMode = 'voice' | 'music' | 'calibration';
type ViewMode = 'espectro' | 'afinador';

const EQ_PROFILES: Record<EQMode, (f: number) => number> = {
  voice: (f) => (f < 100 ? -25 : f > 3000 && f < 6000 ? 12 : 0),
  music: (f) => (f < 80 ? 10 : f > 8000 ? 7 : -5),
  calibration: (f) => 0
};

function SpectrumAnalyzer({ analyser, audioContext }: { analyser: AnalyserNode, audioContext: AudioContext }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [view, setView] = useState<ViewMode>('espectro');
  const [mode, setMode] = useState<EQMode>('voice');
  const [isGeneratorOutput, setIsGeneratorOutput] = useState(false);
  const [genFreq, setGenFreq] = useState(440);

  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const noteRef = useRef({ note: '--', cents: 0 });
  const rmsRef = useRef(0);

  // Manejo de resolución del Canvas (Anti-pixelado)
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    
    const binCount = analyser.frequencyBinCount;
    const freqData = new Float32Array(binCount);
    analyser.getFloatFrequencyData(freqData);

    ctx.clearRect(0, 0, W, H);
    
    // Dibujo de la curva con suavizado (Anti-aliasing manual)
    ctx.beginPath();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 1.5; // Línea más fina = más pro

    for (let i = 0; i < binCount; i++) {
      const freq = binToFreq(i, analyser.fftSize, audioContext.sampleRate);
      const x = (Math.log10(freq) - Math.log10(MIN_FREQ)) / (Math.log10(MAX_FREQ) - Math.log10(MIN_FREQ)) * W;
      const y = dbToY(freqData[i], MIN_DB, MAX_DB, H);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Actualizar métricas
    const timeData = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(timeData);
    rmsRef.current = 20 * Math.log10(calcRMS(timeData) + 1e-10);
  }, [analyser, audioContext]);

  useAnimationFrame(draw, true);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 font-sans text-slate-800">
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* BARRA LATERAL (CONTROL TOTAL) */}
        <aside className="lg:col-span-3 flex flex-col gap-8">
          
          <div className="px-2">
            <h1 className="text-3xl font-black tracking-tighter text-orange-500 italic">FREQ<span className="text-slate-800">LENS</span></h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Professional Suite</p>
          </div>

          {/* Selector de Vista (Antes estaba en el centro) */}
          <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-100 flex flex-col gap-1">
            {(['espectro', 'afinador'] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`py-3 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  view === v ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Modos de Análisis */}
          <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-slate-100">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Modo de Análisis</h3>
            <div className="flex flex-col gap-2">
              {(['voice', 'music', 'calibration'] as EQMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex items-center justify-between px-5 py-3.5 rounded-xl transition-all ${
                    mode === m ? 'bg-orange-500 text-white shadow-lg' : 'bg-slate-50 text-slate-500'
                  }`}
                >
                  <span className="text-xs font-bold capitalize">{m}</span>
                  <div className={`w-1.5 h-1.5 rounded-full ${mode === m ? 'bg-white' : 'bg-slate-200'}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Generador Compacto */}
          <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Generador</h3>
              <button className="w-8 h-8 rounded-lg bg-slate-50 text-xs">▶</button>
            </div>
            <input type="range" className="w-full accent-orange-500" />
            <div className="mt-2 text-2xl font-black">{genFreq}<span className="text-xs text-slate-400 ml-1">Hz</span></div>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL (DERECHA) */}
        <main className="lg:col-span-9 flex flex-col gap-8">
          
          {/* Métricas Header */}
          <div className="grid grid-cols-2 gap-8">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col items-center">
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Nota actual</span>
              <span className="text-6xl font-black text-slate-900 tracking-tighter">--</span>
            </div>
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col items-center">
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Nivel RMS</span>
              <div className="flex items-baseline gap-1">
                <span className="text-6xl font-black text-slate-900 tracking-tighter">
                  {Math.abs(rmsRef.current).toFixed(0)}
                </span>
                <span className="text-sm font-bold text-slate-400 uppercase">dB</span>
              </div>
            </div>
          </div>

          {/* Visualizador de Alta Definición */}
          <div ref={containerRef} className="flex-1 bg-white rounded-[3rem] p-6 shadow-2xl shadow-slate-200/50 border border-slate-100 relative min-h-[550px]">
            <canvas ref={canvasRef} className="w-full h-full" />
            
            {/* Leyenda minimalista */}
            <div className="absolute bottom-10 left-10 flex gap-6 bg-white/90 backdrop-blur px-6 py-3 rounded-2xl border border-slate-100">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="text-[9px] font-black uppercase text-slate-500">Live Input</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-4 h-1 rounded-full bg-emerald-400" />
                  <span className="text-[9px] font-black uppercase text-slate-500">Target</span>
               </div>
            </div>
          </div>
        </main>

      </div>
    </div>
  )
}

export default SpectrumAnalyzer