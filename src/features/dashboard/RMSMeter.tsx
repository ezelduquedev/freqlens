import { useEffect, useRef, useState } from 'react';
import { AudioManager } from '../../core/audio/AudioManager';
import { GlassPanel } from '../../ui/GlassPanel';
import { Activity } from 'lucide-react';

export const RMSMeter = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const peakHoldRef = useRef<number>(-60);
  const peakHoldTimerRef = useRef<number>(0);
  
  const [dbValues, setDbValues] = useState({ rms: -60, peak: -60 });

  useEffect(() => {
    const audioManager = AudioManager.getInstance();
    
    const updateMeter = () => {
      const analyser = audioManager.getAnalyser();
      if (!analyser || audioManager.getContext()?.state !== 'running') {
        // Fallback smooth decline when audio engine is off
        setDbValues(prev => ({
          rms: Math.max(-60, prev.rms - 1.5),
          peak: Math.max(-60, prev.peak - 1.8)
        }));
        drawMeter(-60, -60);
        animationRef.current = requestAnimationFrame(updateMeter);
        return;
      }

      const bufferLength = analyser.fftSize;
      const dataArray = new Float32Array(bufferLength);
      analyser.getFloatTimeDomainData(dataArray);

      // Calcular RMS y Peak en decibelios
      let sumSquares = 0;
      let maxSample = 0;

      for (let i = 0; i < bufferLength; i++) {
        const sample = dataArray[i];
        sumSquares += sample * sample;
        const absSample = Math.abs(sample);
        if (absSample > maxSample) {
          maxSample = absSample;
        }
      }

      const rms = Math.sqrt(sumSquares / bufferLength);
      
      // Convertir a dBFS
      let rmsDb = 20 * Math.log10(rms || 0.0001);
      let peakDb = 20 * Math.log10(maxSample || 0.0001);

      // Cargar límites razonables de visualización (-60 dBFS a 0 dBFS)
      rmsDb = Math.max(-60, Math.min(0, rmsDb));
      peakDb = Math.max(-60, Math.min(0, peakDb));

      // Gestionar el indicador Peak Hold
      if (peakDb >= peakHoldRef.current) {
        peakHoldRef.current = peakDb;
        peakHoldTimerRef.current = 30; // mantener durante ~500ms a 60fps
      } else {
        if (peakHoldTimerRef.current > 0) {
          peakHoldTimerRef.current--;
        } else {
          // Decaimiento lento del pico
          peakHoldRef.current = Math.max(-60, peakHoldRef.current - 0.4);
        }
      }

      setDbValues({ rms: rmsDb, peak: peakDb });
      drawMeter(rmsDb, peakDb);

      animationRef.current = requestAnimationFrame(updateMeter);
    };

    const drawMeter = (rms: number, peak: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const W = rect.width || 260;
      const H = rect.height || 24;
      const dpr = window.devicePixelRatio || 1;

      if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, W, H);

      // Dibujar fondo gris oscuro
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, W, H);

      // Mapear decibelios (-60 a 0) a coordenadas X del canvas (0 a W)
      const getX = (db: number) => {
        const percent = (db + 60) / 60; // 0 a 1
        return Math.max(0, percent * W);
      };

      const rmsX = getX(rms);
      const peakX = getX(peak);
      const holdX = getX(peakHoldRef.current);

      // Crear gradiente de color estilo Ableton Live (Verde -> Amarillo -> Naranja -> Rojo)
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, '#30d158'); // Verde
      grad.addColorStop(0.7, '#ffcc00'); // Amarillo
      grad.addColorStop(0.85, '#ff9f0a'); // Naranja
      grad.addColorStop(1, '#ff453a'); // Rojo

      // Dibujar barra de RMS (Sólido más ancho en el centro)
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(0, H / 2 - 3, rmsX, 6);

      // Dibujar barra de Peak (Línea más fina y traslúcida)
      ctx.globalAlpha = 0.35;
      ctx.fillRect(0, H / 2 - 6, peakX, 12);

      // Dibujar indicador Peak Hold (Línea vertical fina naranja/roja)
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = peakHoldRef.current > -3 ? '#ff453a' : '#ff8c00';
      ctx.fillRect(holdX - 1.5, H / 2 - 8, 3, 16);

      // Dibujar marcas de rejilla (-40dB, -20dB, -10dB, -6dB, -3dB, 0dB)
      const ticks = [-45, -30, -18, -12, -6, 0];
      ticks.forEach(t => {
        const tx = getX(t);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.moveTo(tx, 0);
        ctx.lineTo(tx, H);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.font = '7px "JetBrains Mono", monospace';
        ctx.fillText(t === 0 ? '0' : `${t}`, tx - 5, H - 2);
      });
    };

    updateMeter();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <GlassPanel className="flex flex-col gap-1.5 !p-2 flex-shrink-0 border-white/5 bg-black/10" hoverEffect>
      <div className="flex justify-between items-center select-none font-mono">
        <h4 className="text-[9.5px] font-black text-white uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-accent animate-pulse" />
          MEDIDOR RMS / PEAK
        </h4>
        <div className="flex gap-2 text-[8px] text-success font-black uppercase tracking-tight">
          <span>RMS: {dbValues.rms.toFixed(1)} DB</span>
          <span>PEAK: {dbValues.peak.toFixed(1)} DB</span>
        </div>
      </div>

      <div className="relative w-full h-[24px] rounded-lg overflow-hidden border border-white/5 bg-black/40">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
    </GlassPanel>
  );
};
