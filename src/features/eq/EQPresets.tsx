/* eslint-disable react-hooks/purity */
import { useState, useEffect } from 'react'
import { AdaptiveEQManager } from '../../core/audio/AdaptiveEQManager'
import { Save, Trash2, Share2, Download, X, Activity, FolderPlus } from 'lucide-react'

interface Preset {
  name: string
  description: string
  values: { [key: string]: number }
}

const DEFAULT_PRESETS: Preset[] = [
  {
    name: 'Plano (Flat)',
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
  
  const [customPresets, setCustomPresets] = useState<Preset[]>([])
  const [selectedPresetName, setSelectedPresetName] = useState<string>(DEFAULT_PRESETS[0].name)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Combined Presets List
  const allPresets = [...DEFAULT_PRESETS, ...customPresets]
  const currentPreset = allPresets.find(p => p.name === selectedPresetName) || DEFAULT_PRESETS[0]

  // Load Custom Presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('freqlens_custom_presets')
    if (saved) {
      try {
        setCustomPresets(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load custom presets', e)
      }
    }
  }, [])

  const applyPreset = (preset: Preset) => {
    Object.entries(preset.values).forEach(([id, val]) => {
      eqManager.setBandGain(id, val)
    })
    setSelectedPresetName(preset.name)
    onPresetApply()
  }

  const handleSavePreset = () => {
    if (!newPresetName.trim()) return

    const bands = eqManager.getBands()
    const values: Record<string, number> = {}
    bands.forEach(b => {
      values[b.id] = b.gain
    })

    const newPreset: Preset = {
      name: newPresetName.trim(),
      description: `Espacio acústico guardado el ${new Date().toLocaleDateString('es-ES')}.`,
      values
    }

    const updated = [...customPresets, newPreset]
    setCustomPresets(updated)
    localStorage.setItem('freqlens_custom_presets', JSON.stringify(updated))
    
    setSelectedPresetName(newPreset.name)
    setNewPresetName('')
    setShowSaveModal(false)
    
    setSuccessMessage('¡Sala guardada!')
    setTimeout(() => setSuccessMessage(''), 2500)
    
    onPresetApply()
  }

  const handleDeletePreset = (name: string) => {
    const updated = customPresets.filter(p => p.name !== name)
    setCustomPresets(updated)
    localStorage.setItem('freqlens_custom_presets', JSON.stringify(updated))
    
    // Fallback to Flat
    applyPreset(DEFAULT_PRESETS[0])
    
    setSuccessMessage('Sala eliminada.')
    setTimeout(() => setSuccessMessage(''), 2500)
  }

  const exportJSON = () => {
    const data = {
      version: 1,
      name: currentPreset.name,
      description: currentPreset.description,
      timestamp: new Date().toISOString(),
      bands: eqManager.getBands().map(b => ({ id: b.id, frequency: b.frequency, gain: b.gain, Q: b.Q }))
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `freqlens-${currentPreset.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyShareLink = () => {
    const bands = eqManager.getBands()
    const config = bands.map(b => `${b.id}:${b.gain.toFixed(1)}`).join('|')
    const base64 = btoa(config)
    const shareUrl = `${window.location.origin}${window.location.pathname}#eq=${base64}`
    
    navigator.clipboard.writeText(shareUrl)
    setSuccessMessage('¡Enlace copiado!')
    setTimeout(() => setSuccessMessage(''), 2500)
  }

  return (
    <div className="bg-[#05070a] border border-white/5 rounded-3xl p-4 select-none font-mono flex flex-col h-full min-h-0 relative">
      
      {/* 1. Header Area */}
      <div className="flex justify-between items-center mb-3 flex-shrink-0">
        <h3 className="text-white font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1">
          <Activity className="w-3.5 h-3.5 text-accent" />
          Ajustes / Salas
        </h3>
        
        {successMessage ? (
          <span className="text-[8px] font-bold text-success uppercase tracking-widest bg-success/5 px-2 py-0.5 border border-success/15 rounded-md animate-fade-in">
            {successMessage}
          </span>
        ) : (
          <span className="text-[7px] text-text-muted uppercase tracking-widest font-black">
            Preset Activo
          </span>
        )}
      </div>

      {/* 2. Scrollable Preset Cards Stack List */}
      <div className="flex-grow overflow-y-auto no-scrollbar flex flex-col gap-2 pr-0.5 mb-3 min-h-0">
        
        {/* Compact Dashed Add Preset Card */}
        <button
          onClick={() => setShowSaveModal(true)}
          className="p-2 bg-accent/5 border border-dashed border-accent/20 hover:border-accent hover:bg-accent/10 transition-all rounded-2xl flex items-center justify-center gap-2 h-12 flex-shrink-0 cursor-pointer group"
        >
          <FolderPlus className="w-4 h-4 text-accent group-hover:scale-105 transition-transform" />
          <span className="text-[8px] text-accent font-black uppercase tracking-wider">Guardar Sala / Ajuste de EQ</span>
        </button>

        {/* Dynamic Preset Cards List */}
        {allPresets.map((preset) => {
          const isActive = selectedPresetName === preset.name
          const isCustom = customPresets.some(p => p.name === preset.name)
          
          return (
            <div
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className={`group relative px-3 py-2 bg-panel border rounded-2xl text-left cursor-pointer transition-all duration-200 flex items-center justify-between h-12 flex-shrink-0 ${isActive ? 'border-accent bg-accent/[0.02] shadow-[0_0_8px_rgba(255,140,0,0.12)]' : 'border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.02]'}`}
            >
              {/* Left Side: Name and Active Light dot */}
              <div className="flex items-center gap-2 max-w-[50%] min-w-0">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? 'bg-accent shadow-[0_0_6px_var(--accent)] animate-pulse' : 'bg-white/10'}`} />
                <div className="min-w-0">
                  <h4 className={`font-black text-[10px] leading-tight transition-colors truncate ${isActive ? 'text-accent' : 'text-white group-hover:text-accent'}`}>
                    {preset.name}
                  </h4>
                  <span className="text-[6px] text-text-muted uppercase tracking-widest block -mt-0.5">
                    {isCustom ? 'Calibrado' : 'DSP'}
                  </span>
                </div>
              </div>

              {/* Right Side: Mini SVG curve and delete option */}
              <div className="flex items-center gap-2">
                <div className="w-12 h-6 overflow-hidden opacity-30 group-hover:opacity-85 transition-opacity">
                  <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                    <path 
                      d={generatePresetPath(preset.values)}
                      fill="none" 
                      stroke={isActive ? '#ff8c00' : '#4b5563'} 
                      strokeWidth="2"
                      className="transition-all duration-300"
                    />
                  </svg>
                </div>
                
                {/* Delete button (only visible on hover for custom spaces) */}
                {isCustom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeletePreset(preset.name)
                    }}
                    className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all border border-red-500/15 cursor-pointer ml-1"
                    title="Eliminar Espacio"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )
        })}

      </div>

      {/* 3. Inline Save Modal Dialog overlay */}
      {showSaveModal && (
        <div className="absolute inset-0 bg-[#05070a]/95 backdrop-blur-md rounded-3xl p-4 flex flex-col justify-center items-center gap-4 z-30 animate-fade-in">
          <div className="text-center w-full">
            <h4 className="text-white font-extrabold text-[10px] uppercase tracking-widest mb-1">Guardar Ajuste Acústico</h4>
            <p className="text-[7px] text-text-muted uppercase font-semibold">Introduce el nombre del espacio o curva</p>
          </div>
          
          <input
            type="text"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            placeholder="Ej. Control Room A, Home Studio..."
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-text-muted focus:outline-none focus:border-accent text-center"
            maxLength={22}
            autoFocus
          />

          <div className="flex gap-2 w-full">
            <button
              onClick={() => {
                setShowSaveModal(false)
                setNewPresetName('')
              }}
              className="flex-1 py-2 bg-white/[0.02] border border-white/5 text-text-soft hover:text-white rounded-xl text-[9px] uppercase font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Cancelar
            </button>
            <button
              onClick={handleSavePreset}
              disabled={!newPresetName.trim()}
              className="flex-1 py-2 bg-accent text-white rounded-xl text-[9px] uppercase font-black transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1 shadow-[0_0_8px_var(--accent-glow)]"
            >
              <Save className="w-3.5 h-3.5" />
              Confirmar
            </button>
          </div>
        </div>
      )}

      {/* 4. Details / Share / Export Footer Area */}
      <div className="border-t border-white/5 pt-3 flex-shrink-0 flex flex-col gap-2">
        {/* Curve metadata description */}
        <div className="bg-black/35 border border-white/[0.02] rounded-xl p-2">
          <span className="text-[6px] text-accent uppercase font-bold tracking-widest block mb-0.5">Detalles del Preset</span>
          <p className="text-[8px] text-text-soft leading-normal uppercase tracking-tight line-clamp-2">
            {currentPreset.description}
          </p>
        </div>

        {/* Share and export buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={exportJSON}
            className="py-2 bg-white/[0.01] border border-white/5 rounded-xl text-text-soft hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer flex items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-tight"
            title="Exportar archivo JSON"
          >
            <Download className="w-3.5 h-3.5 text-accent" />
            <span>Exportar</span>
          </button>
          <button 
            onClick={copyShareLink}
            className="py-2 bg-white/[0.01] border border-white/5 rounded-xl text-text-soft hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer flex items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-tight"
            title="Copiar Enlace"
          >
            <Share2 className="w-3.5 h-3.5 text-accent" />
            <span>Compartir</span>
          </button>
        </div>
      </div>

    </div>
  )
}
