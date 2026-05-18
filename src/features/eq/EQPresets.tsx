/* eslint-disable react-hooks/purity */
import { AdaptiveEQManager } from '../../core/audio/AdaptiveEQManager'

interface Preset {
  name: string
  description: string
  values: { [key: string]: number }
}

const PRESETS: Preset[] = [
  {
    name: 'Plano',
    description: 'Reseteo completo a 0dB para referencia neutra.',
    values: { 'hpf': 20, 'low-shelf': 0, 'mid-1': 0, 'mid-2': 0, 'high-shelf': 0 }
  },
  {
    name: 'Voz / Podcast',
    description: 'Claridad para diálogos. HPF a 80Hz y boost en medios-altos.',
    values: { 'hpf': 80, 'low-shelf': -2, 'mid-1': 0, 'mid-2': 3, 'high-shelf': 1 }
  },
  {
    name: 'Música Pop',
    description: 'Curva en V: Bajos profundos y agudos brillantes.',
    values: { 'hpf': 30, 'low-shelf': 4, 'mid-1': -2, 'mid-2': -1, 'high-shelf': 4 }
  },
  {
    name: 'Sala Pequeña',
    description: 'Corrección típica para modos de sala pequeños (125-250Hz).',
    values: { 'hpf': 40, 'low-shelf': -4, 'mid-1': -3, 'mid-2': 0, 'high-shelf': 1 }
  },
  {
    name: 'Monitor Flat',
    description: 'Optimizado para mezcla analítica en estudio.',
    values: { 'hpf': 20, 'low-shelf': 0, 'mid-1': 0.5, 'mid-2': 0, 'high-shelf': -0.5 }
  },
  {
    name: 'Hi-Fi Listening',
    description: 'Smile curve suave para escucha placentera.',
    values: { 'hpf': 20, 'low-shelf': 2, 'mid-1': -1, 'mid-2': 0, 'high-shelf': 3 }
  },
  {
    name: 'Graves Reforzados',
    description: 'Énfasis en sub-graves y pegada.',
    values: { 'hpf': 25, 'low-shelf': 6, 'mid-1': 1, 'mid-2': 0, 'high-shelf': -2 }
  },
  {
    name: 'Claridad Vocal',
    description: 'Boost en presencia (3-5kHz) y corte en fango.',
    values: { 'hpf': 100, 'low-shelf': -3, 'mid-1': -2, 'mid-2': 4, 'high-shelf': 2 }
  }
]

const generatePresetPath = (values: Record<string, number>): string => {
  const bands = [
    { freq: 20, gain: values['hpf'] || 0 },
    { freq: 100, gain: values['low-shelf'] || 0 },
    { freq: 500, gain: values['mid-1'] || 0 },
    { freq: 2000, gain: values['mid-2'] || 0 },
    { freq: 8000, gain: values['high-shelf'] || 0 },
    { freq: 20000, gain: values['high-shelf'] || 0 }
  ]
  
  const logMin = Math.log10(20)
  const logMax = Math.log10(20000)
  
  const points = bands.map(b => {
    const x = ((Math.log10(b.freq) - logMin) / (logMax - logMin)) * 100
    const y = 10 - (b.gain * (10 / 12)) // Mapear -12..12 a 20..0
    return { x, y }
  })
  
  let path = `M ${points[0].x},${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1]
    const p1 = points[i]
    const cx = (p0.x + p1.x) / 2
    path += ` C ${cx},${p0.y} ${cx},${p1.y} ${p1.x},${p1.y}`
  }
  return path
}

export const EQPresets = ({ onPresetApply }: { onPresetApply: () => void }) => {
  const eqManager = AdaptiveEQManager.getInstance()

  const applyPreset = (preset: Preset) => {
    Object.entries(preset.values).forEach(([id, val]) => {
      eqManager.setBandGain(id, val)
    })
    onPresetApply()
  }

  const exportJSON = () => {
    const data = {
      version: 1,
      timestamp: new Date().toISOString(),
      bands: eqManager.getBands().map(b => ({ id: b.id, frequency: b.frequency, gain: b.gain, Q: b.Q }))
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `freqlens-eq-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyShareLink = () => {
    const bands = eqManager.getBands()
    const config = bands.map(b => `${b.id}:${b.gain.toFixed(1)}`).join('|')
    const base64 = btoa(config)
    const shareUrl = `${window.location.origin}${window.location.pathname}#eq=${base64}`
    
    navigator.clipboard.writeText(shareUrl)
    alert('Enlace copiado al portapapeles.')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-1">DSP Presets</h3>
          <p className="text-[10px] text-slate-500 uppercase">Selección de curvas profesionales</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={exportJSON}
            className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Exportar JSON"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          </button>
          <button 
            onClick={copyShareLink}
            className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Copiar Enlace"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {PRESETS.map((preset) => (
          <button
            key={preset.name}
            onClick={() => applyPreset(preset)}
            className="group p-4 bg-slate-900/40 border border-slate-800 rounded-2xl text-left hover:border-cyan-400/50 transition-all hover:scale-[1.02]"
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-white font-bold text-[11px] leading-tight group-hover:text-cyan-400 transition-colors">{preset.name}</h4>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-cyan-400"></div>
            </div>
            <p className="text-[9px] text-slate-500 leading-relaxed uppercase tracking-tight line-clamp-2">{preset.description}</p>
            
            {/* Mini visualización de la curva (SVG path dinámico) */}
            <svg className="w-full h-8 mt-3 opacity-30 group-hover:opacity-100 transition-opacity" viewBox="0 0 100 20">
              <path 
                d={generatePresetPath(preset.values)}
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                className="text-cyan-400 transition-all duration-300"
              />
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}
