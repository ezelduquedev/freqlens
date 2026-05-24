import { useState, useEffect } from 'react';
import { Sliders, RefreshCw, Check, Pencil } from 'lucide-react';
import { AdaptiveEQManager } from '../../core/audio/AdaptiveEQManager';
import { RoomProfileStorage, type RoomProfile } from '../../core/audio/RoomProfileStorage';
import { PresetStorage, type Preset } from './PresetStorage';
import { emitEQUpdate } from '../../core/audio/EQEventBus';

const PRESETS: Preset[] = [
  {
    id: 'flat',
    name: 'Plano',
    description: 'REFERENCIA DE RESPUESTA PLANA ESTÁNDAR PARA MEZCLA NEUTRA.',
    values: { 'hpf': 20, 'low-shelf': 0, 'mid-1': 0, 'mid-2': 0, 'high-shelf': 0 },
    icon: 'flat'
  },
  {
    id: 'podcast',
    name: 'Voz / Podcast',
    description: 'CLARIDAD EN VOCES Y DIÁLOGOS. ATENÚA GRAVES DE MICRÓFONO Y REALZA PRESENCIA.',
    values: { 'hpf': 80, 'low-shelf': -2, 'mid-1': -1, 'mid-2': 3, 'high-shelf': 1.5 },
    icon: 'podcast'
  },
  {
    id: 'pop',
    name: 'Música Pop V-Curve',
    description: 'SMILE CURVE CLÁSICA: REALCE SUTIL EN AGUDOS Y SUBGRAVES.',
    values: { 'hpf': 25, 'low-shelf': 3.5, 'mid-1': -1.5, 'mid-2': -0.8, 'high-shelf': 3.5 },
    icon: 'pop'
  },
  {
    id: 'hifi',
    name: 'Hi-Fi Master',
    description: 'CURVA OPTIMIZADA PARA ESCUCHA DE ALTA DEFINICIÓN PLACENTERA.',
    values: { 'hpf': 20, 'low-shelf': 1.5, 'mid-1': -0.5, 'mid-2': 0, 'high-shelf': 2.0 },
    icon: 'hifi'
  }
];

const USER_ICONS = [
  { id: 'custom_1', name: 'Auriculares' },
  { id: 'custom_2', name: 'Escudo' },
  { id: 'custom_3', name: 'Espacio' },
  { id: 'custom_4', name: 'Extra' }
];

const getPresetIconUrl = (preset: Preset) => {
  if (preset.icon) {
    return `/preset-icons/${preset.icon}.svg`;
  }
  if (preset.id === 'flat' || preset.id === 'podcast' || preset.id === 'pop' || preset.id === 'hifi') {
    return `/preset-icons/${preset.id}.svg`;
  }
  return `/preset-icons/custom_1.svg`;
};

interface EQPresetsProps {
  onPresetApply: () => void;
  variant?: 'compact' | 'full';
}

const getDynamicDescription = (profile: RoomProfile, presetId: string): string => {
  const isControlRoom = profile.name.toLowerCase().includes('control') || 
                        profile.name.toLowerCase().includes('studio') || 
                        profile.name.toLowerCase().includes('estudio') ||
                        profile.id === 'mock-1';

  const isUntreated = profile.name.toLowerCase().includes('dormitorio') || 
                      profile.name.toLowerCase().includes('cama') || 
                      profile.name.toLowerCase().includes('habitacion') ||
                      profile.name.toLowerCase().includes('no tratado') ||
                      profile.id === 'mock-2';

  if (isControlRoom) {
    switch (presetId) {
      case 'flat':
        return 'RESPUESTA PLANA Y NEUTRA APLICADA EN CONTROL ROOM. IDEAL PARA MEZCLA EXACTA Y ANÁLISIS DE REFERENCIA SIN COLORACIÓN ACÚSTICA.';
      case 'podcast':
        return 'MODO VOZ EN CONTROL ROOM. CORRECCIÓN DE GRAVES FILTRADA Y PRESENCIA DETALLADA PARA CONTROL DE VOCES CRISTALINAS SIN COLORACIÓN DE FONDO.';
      case 'pop':
        return 'RESPUESTA POP V-CURVE EN SALA DE CONTROL. SUBGRAVES REDONDEADOS Y AGUDOS AIROSOS PARA UNA ESCUCHA COMERCIAL EMOCIONANTE Y DINÁMICA.';
      case 'hifi':
        return 'MODO HI-FI MASTER EN SALA DE CONTROL. OPTIMIZACIÓN AUDIÓFILA SUTIL CON DISFRUTE PLACENTERO DE ALTA FIDELIDAD Y MÁXIMO RANGO DINÁMICO.';
      case profile.id:
        return 'CORRECCIÓN DE SALA ACTIVA EN CONTROL ROOM. COMPENSACIÓN INVERSA TOTALMENTE PLANA BASADA EN LA ACÚSTICA FÍSICA PROPIA DEL ESTUDIO.';
      default:
        return profile.notes || 'SALA DE CONTROL PRINCIPAL CON RESPUESTA ACÚSTICA OPTIMIZADA PARA MONITOREO DE REFERENCIA.';
    }
  }

  if (isUntreated) {
    switch (presetId) {
      case 'flat':
        return 'RESPUESTA PLANA APLICADA A ENTORNO HABITACIONAL. LA COMPENSACIÓN SUAVIZA EL BOOMY, PERO LA FALTA DE TRATAMIENTO PUEDE REDUCIR LA PRECISIÓN DE GRAVES.';
      case 'podcast':
        return 'OPTIMIZACIÓN DE PODCAST EN DORMITORIO. FILTRADO HPF CRÍTICO APLICADO PARA ELIMINAR EL COPLE DE LA SALA NO TRATADA Y RESALTAR LA VOZ.';
      case 'pop':
        return 'COLORACIÓN ENERGÉTICA EN DORMITORIO. LA CURVA POP EN V ENMASCARA EL DESBALANCE ACÚSTICO DE LA SALA CON UN SONIDO DIVERTIDO Y DINÁMICO.';
      case 'hifi':
        return 'ESCUCHA RELAJADA EN DORMITORIO. APORTA CALIDEZ A LAS FRECUENCIAS MEDIAS Y REDUCE LA FATIGA AUDITIVA COMPENSANDO LOS PUNTOS MÁS DUROS DEL ESPACIO.';
      case profile.id:
        return 'CALIBRACIÓN ACÚSTICA ACTIVA EN DORMITORIO. CORRECCIÓN AGRESIVA DE RESONANCIAS DE PAREDES Y GRAVES SUCIOS PARA LOGRAR MÁXIMA NEUTRALIDAD.';
      default:
        return profile.notes || 'ENTORNO DE ESCUCHA NO TRATADO. SE SUGIERE CORRECCIÓN PARAMÉTRICA PARA COMPENSAR LAS RESONANCIAS DE LA HABITACIÓN.';
    }
  }

  // Fallback for custom calibrated profiles
  switch (presetId) {
    case 'flat':
      return `REFERENCIA PLANA APLICADA A ${profile.name.toUpperCase()}. CALIBRACIÓN ESTÁNDAR PARA LOGRAR EL PUNTO DE MEZCLA MÁS NEUTRO POSIBLE.`;
    case 'podcast':
      return `MODO PODCAST ACTIVO EN ${profile.name.toUpperCase()}. ENFATIZA EL RANGO DE LA VOZ Y ELIMINA RESONANCIAS DE GRAVES MEDIOS EN ESTA SALA.`;
    case 'pop':
      return `PERFIL POP / V-CURVE EN ${profile.name.toUpperCase()}. SONIDO ENERGIZADO CON GRAVES ENRIQUECIDOS Y AGUDOS REALZADOS PARA PROBAR MEZCLAS COMERCIALES.`;
    case 'hifi':
      return `AJUSTE AUDIÓFILO HI-FI EN ${profile.name.toUpperCase()}. EQUILIBRIO PERFECTO DE CALIDEZ Y SUTILEZA PARA LOGRAR UNA ESCUCHA PLACENTERA Y EQUILIBRADA.`;
    case profile.id:
      return `CALIBRACIÓN ACÚSTICA PROPIA ACTIVA EN ${profile.name.toUpperCase()}. COMPENSANDO RESONANCIAS FÍSICAS DE ACUERDO A LA MEDICIÓN DE LA SALA.`;
    default:
      return profile.notes || `PERFIL ACÚSTICO DE ${profile.name.toUpperCase()}. RESPUESTA DE FRECUENCIA CONFIGURADA DE ACUERDO AL ENTORNO FÍSICO.`;
  }
};

export const EQPresets = ({ onPresetApply, variant = 'full' }: EQPresetsProps) => {
  const eqManager = AdaptiveEQManager.getInstance();
  
  // Basic State
  const [selectedId, setSelectedId] = useState<string>('flat');
  const [profiles, setProfiles] = useState<RoomProfile[]>([]);
  const [customPresets, setCustomPresets] = useState<Preset[]>([]);
  const [roomDiagnostic, setRoomDiagnostic] = useState<string>(
    'RESPUESTA DE SALA ACTIVA. APLIQUE UN PERFIL O PRESET PARA COMPENSAR LA RESPUESTA DE FRECUENCIA.'
  );
  const [descriptionOverrides, setDescriptionOverrides] = useState<{ [id: string]: string }>({});

  // Modals / Editing state
  const [editPresetId, setEditPresetId] = useState<string>('');
  const [editPresetName, setEditPresetName] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editPresetIcon, setEditPresetIcon] = useState<string>('custom_1');
  const [editPresetNameInput, setEditPresetNameInput] = useState<string>('');

  const [editRoomId, setEditRoomId] = useState<string>('');
  const [editRoomName, setEditRoomName] = useState<string>('');
  const [editRoomNotes, setEditRoomNotes] = useState<string>('');

  const [showAddPreset, setShowAddPreset] = useState<boolean>(false);
  const [newPresetName, setNewPresetName] = useState<string>('');
  const [newPresetDescription, setNewPresetDescription] = useState<string>('');
  const [newPresetIcon, setNewPresetIcon] = useState<string>('custom_1');

  const [showAddRoom, setShowAddRoom] = useState<boolean>(false);
  const [newRoomName, setNewRoomName] = useState<string>('');
  const [newRoomDescription, setNewRoomDescription] = useState<string>('');

  const loadData = () => {
    const list = RoomProfileStorage.getAllProfiles();
    setProfiles(list);
    
    const savedPresets = PresetStorage.getAll();
    setCustomPresets(savedPresets);

    const rawOverrides = localStorage.getItem('freqlens_description_overrides');
    if (rawOverrides) {
      try {
        setDescriptionOverrides(JSON.parse(rawOverrides));
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [onPresetApply]);

  useEffect(() => {
    if (profiles.length > 0) {
      const activeProf = profiles.find(p => p.id === selectedId) || profiles[0];
      const issuesMsg = activeProf.issues.map(iss => iss.message).join('. ');
      const notes = getDynamicDescription(activeProf, selectedId);
      const customOverrideNote = descriptionOverrides[selectedId] || activeProf.notes || '';
      const finalNote = customOverrideNote ? customOverrideNote : notes;
      setRoomDiagnostic(`${finalNote.toUpperCase()} ${issuesMsg.toUpperCase()}`);
    } else {
      setRoomDiagnostic('RESPUESTA DE SALA ACTIVA. APLIQUE UN PERFIL O PRESET PARA COMPENSAR LA RESPUESTA DE FRECUENCIA.');
    }
  }, [selectedId, profiles, descriptionOverrides]);

  const getCurrentEQValues = () => {
    const values: { [key: string]: number } = {};
    eqManager.getBands().forEach(band => {
      if (band.id === 'hpf') {
        values[band.id] = band.frequency;
      } else {
        values[band.id] = band.gain;
      }
    });
    return values;
  };

  // Handlers
  const handleAddPreset = () => {
    const id = 'custom-' + Date.now().toString();
    const preset: Preset = {
      id,
      name: newPresetName || 'Preset Personalizado',
      description: newPresetDescription || 'Preset de usuario personalizado.',
      values: getCurrentEQValues(),
      icon: newPresetIcon || 'custom_1'
    };
    PresetStorage.save(preset);
    setShowAddPreset(false);
    setNewPresetName('');
    setNewPresetDescription('');
    setNewPresetIcon('custom_1');
    loadData();
  };

  const handleEditPresetSave = () => {
    if (!editPresetId) return;
    
    // Update local overrides first (works for all presets)
    const newOverrides = { ...descriptionOverrides, [editPresetId]: editDescription };
    localStorage.setItem('freqlens_description_overrides', JSON.stringify(newOverrides));
    setDescriptionOverrides(newOverrides);
    
    // If it's a custom preset, update it in custom storage too
    if (editPresetId.startsWith('custom-')) {
      const savedPresets = PresetStorage.getAll();
      const targetPreset = savedPresets.find(p => p.id === editPresetId);
      if (targetPreset) {
        targetPreset.name = editPresetNameInput || targetPreset.name;
        targetPreset.description = editDescription;
        targetPreset.icon = editPresetIcon;
        PresetStorage.save(targetPreset);
      }
    } else {
      PresetStorage.updateDescription(editPresetId, editDescription);
    }
    
    setEditPresetId('');
    loadData();
  };

  const handleAddRoom = () => {
    const id = 'room-' + Date.now().toString();
    const profile: RoomProfile = {
      id,
      name: newRoomName || 'Nueva Sala Calibrada',
      date: new Date().toLocaleDateString('es-ES'),
      timestamp: Date.now(),
      averageRMS: -40.0,
      acousticRating: 'Tratable',
      issues: [],
      eqValues: getCurrentEQValues(),
      notes: newRoomDescription || 'Perfil de sala calibrado por el usuario.'
    };
    RoomProfileStorage.saveProfile(profile);
    setShowAddRoom(false);
    setNewRoomName('');
    setNewRoomDescription('');
    loadData();
  };

  const handleEditRoomSave = () => {
    if (!editRoomId) return;
    
    const profilesList = RoomProfileStorage.getAllProfiles();
    const targetProfile = profilesList.find(p => p.id === editRoomId);
    if (targetProfile) {
      targetProfile.notes = editRoomNotes;
      RoomProfileStorage.saveProfile(targetProfile);
    }
    
    // Also save in general overrides just in case description check looks there
    const newOverrides = { ...descriptionOverrides, [editRoomId]: editRoomNotes };
    localStorage.setItem('freqlens_description_overrides', JSON.stringify(newOverrides));
    setDescriptionOverrides(newOverrides);

    setEditRoomId('');
    loadData();
  };

  const applyPreset = (preset: Preset) => {
    Object.entries(preset.values).forEach(([id, val]) => {
      if (id === 'hpf') {
        eqManager.setBandFrequency(id, val);
        eqManager.setBandGain(id, 0);
      } else {
        eqManager.setBandGain(id, val);
      }
    });
    setSelectedId(preset.id);
    onPresetApply();
    emitEQUpdate();
  };

  const applyProfile = (profile: RoomProfile) => {
    Object.entries(profile.eqValues).forEach(([id, val]) => {
      if (id === 'hpf') {
        eqManager.setBandFrequency(id, val > 30 ? val : 20);
        eqManager.setBandGain(id, 0);
      } else {
        eqManager.setBandGain(id, val);
      }
    });
    setSelectedId(profile.id);
    onPresetApply();
    emitEQUpdate();
  };

  // Helper to draw a tiny SVG thumbnail path for calibrated EQ profiles
  const getTinyCurvePath = (eqValues: { [bandId: string]: number }) => {
    const hpf = eqValues['hpf'] ? -2 : 0;
    const low = eqValues['low-shelf'] || 0;
    const mid1 = eqValues['mid-1'] || 0;
    const mid2 = eqValues['mid-2'] || 0;
    const high = eqValues['high-shelf'] || 0;

    // Map -12..12 gains to 10..30 Y height coordinate
    const getY = (val: number) => 20 - (val / 12) * 10;

    return `M 10 20 Q 30 ${getY(hpf)} 50 ${getY(low)} T 90 ${getY(mid1)} T 130 ${getY(mid2)} T 170 ${getY(high)} L 180 20`;
  };

  // Compact Mode Render (used in Main Console dashboard)
  if (variant === 'compact') {
    const allPresets = [...PRESETS, ...customPresets];
    return (
      <div className="flex flex-col h-full min-h-0 select-none font-mono gap-3">
        <div className="flex justify-between items-center flex-shrink-0">
          <h4 className="text-[10px] font-black text-text uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-accent" />
            PERFILES DE SALA / PRESETS
          </h4>
          <button onClick={loadData} className="p-1 hover:text-text text-text-muted transition-colors cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-shrink-0 bg-black/45 border border-white/5 p-2 rounded-xl text-[7.5px] text-text-soft text-center tracking-wider font-mono leading-relaxed uppercase">
          {roomDiagnostic}
        </div>

        <div className="flex-grow overflow-y-auto no-scrollbar min-h-0">
          <div className="grid grid-cols-2 gap-2 h-full">
            {allPresets.map(preset => {
              const isActive = selectedId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className={`p-2.5 rounded-3xl text-left border cursor-pointer hover:bg-white/[0.02] flex flex-col justify-between transition-all duration-200 bg-white dark:bg-bg-elevated shadow-[0_8px_30px_rgba(0,0,0,0.03)] dark:shadow-none ${
                    isActive 
                      ? 'border-accent/40 bg-accent/[0.01] shadow-[0_8px_30px_rgba(255,140,0,0.08)]' 
                      : 'border-black/5 dark:border-white/5 hover:border-accent/20'
                  }`}
                >
                  <div className="flex justify-between items-center w-full min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <img 
                        src={getPresetIconUrl(preset)} 
                        alt="" 
                        className="w-4 h-4 object-contain flex-shrink-0 preset-icon-image" 
                      />
                      <span className={`text-[10px] font-black truncate uppercase ${isActive ? 'text-accent' : 'text-text'}`}>
                        {preset.name}
                      </span>
                    </div>
                    {isActive && <Check className="w-3 h-3 text-accent flex-shrink-0" />}
                  </div>
                  <span className="text-[6.5px] text-text-muted leading-relaxed font-bold uppercase tracking-tight block mt-2">
                    {descriptionOverrides[preset.id] || preset.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Full Mode Render (used in Dedicated EQ Tab Page, exactly matching screenshot 1)
  return (
    <div className="flex flex-col h-auto select-none font-mono gap-2 animate-fade-in">
      
      {/* Header with toolbar */}
      <div className="flex justify-between items-center flex-shrink-0">
        <h4 className="text-[10.5px] font-black text-text uppercase tracking-wider flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-accent" />
          PERFILES DE SALA / PRESETS
        </h4>
        {/* Toolbar */}
        <div className="flex gap-2 items-center">
          <button 
            onClick={() => setShowAddRoom(true)} 
            className="px-2 py-0.5 rounded-lg border border-black/5 dark:border-white/5 bg-white dark:bg-surface hover:bg-accent/10 hover:text-accent text-text-muted transition-colors text-[7.5px] font-bold tracking-wider cursor-pointer uppercase shadow-sm"
          >
            + SALA
          </button>
          <button 
            onClick={() => setShowAddPreset(true)} 
            className="px-2 py-0.5 rounded-lg border border-black/5 dark:border-white/5 bg-white dark:bg-surface hover:bg-accent/10 hover:text-accent text-text-muted transition-colors text-[7.5px] font-bold tracking-wider cursor-pointer uppercase shadow-sm"
          >
            + PRESET
          </button>
          {/* Refresh button */}
          <button onClick={loadData} className="p-1 hover:text-text text-text-muted transition-colors cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. CALIBRATED ROOMS SECTION */}
      <div className="flex flex-col gap-1">
        <div className="text-[7.5px] font-black text-text-muted uppercase tracking-widest border-b border-black/5 dark:border-white/5 pb-1">
          SALAS CALIBRADAS (ROOM CORRECTION)
        </div>
        
        {profiles.length === 0 ? (
          <div className="text-[8px] text-text-muted text-center py-2 border border-black/5 dark:border-white/5 rounded-lg">
            NINGUNA SALA MEDIDA AÚN.
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {profiles.map(prof => {
              const isActive = selectedId === prof.id;
              const ratingColor = prof.acousticRating === 'Excelente' || prof.acousticRating === 'Buena'
                ? 'text-yellow-500 border-yellow-500/30 bg-yellow-500/5'
                : 'text-orange-500 border-orange-500/30 bg-orange-500/5';

              return (
                <div
                  key={prof.id}
                  onClick={() => applyProfile(prof)}
                  className={`p-4 rounded-3xl border text-left cursor-pointer transition-all duration-200 flex flex-col bg-white dark:bg-bg-elevated shadow-[0_8px_30px_rgba(0,0,0,0.03)] dark:shadow-none ${
                    isActive 
                      ? 'border-accent/40 bg-accent/[0.01] shadow-[0_8px_30px_rgba(255,140,0,0.08)]' 
                      : 'border-black/5 dark:border-white/5 hover:border-accent/20'
                  }`}
                >
                  {/* Single compact row: dot + name + mini-curve + rating */}
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                    <span className="text-[9px] font-black text-text uppercase truncate flex-shrink-0 max-w-[1200]">{prof.name}</span>
                    
                    {/* Inline mini-curve */}
                    <div className="flex-grow h-4 rounded overflow-hidden flex items-center justify-center opacity-60">
                      <svg className="w-full h-full stroke-black/10 dark:stroke-white/20" viewBox="0 0 180 40">
                        <path d="M 0 20 L 180 20" strokeDasharray="2 2" strokeWidth="0.5" />
                        <path 
                          d={getTinyCurvePath(prof.eqValues)} 
                          fill="none" 
                          stroke="#ff8c00" 
                          strokeWidth="1.5" 
                        />
                      </svg>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`text-[7px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-widest ${ratingColor}`}>
                        {prof.acousticRating}
                      </span>
                      <span title="Editar notas" className="inline-flex">
                        <Pencil 
                          className="w-3 h-3 text-text-muted hover:text-accent cursor-pointer transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditRoomId(prof.id);
                            setEditRoomName(prof.name);
                            setEditRoomNotes(prof.notes || '');
                          }}
                        />
                      </span>
                      {!prof.id.startsWith('mock-') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            RoomProfileStorage.deleteProfile(prof.id);
                            loadData();
                          }}
                          className="p-0.5 hover:text-danger text-text-muted transition-colors cursor-pointer"
                          title="Eliminar Sala"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                      {isActive && <Check className="w-3 h-3 text-accent" />}
                    </div>
                  </div>

                  {/* Room Description Note */}
                  <div className="text-[6.5px] text-text-muted leading-relaxed font-bold uppercase tracking-tight mt-1 ml-3.5">
                    {prof.notes || 'SALA CALIBRADA SIN NOTAS ADICIONALES.'}
                  </div>

                  {/* Issue pill - inline small */}
                  {prof.issues.length > 0 && (
                    <div className={`mt-1.5 ml-3.5 px-2 py-0.5 rounded-full text-[6.5px] font-black uppercase tracking-widest border leading-none w-fit ${
                      prof.acousticRating === 'Buena' 
                        ? 'border-yellow-500/20 text-yellow-500 bg-yellow-500/5' 
                        : 'border-orange-500/20 text-orange-500 bg-orange-500/5'
                    }`}>
                      {prof.issues[0].message.toUpperCase()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. REFERENCE PRESETS SECTION */}
      <div className="flex flex-col gap-2">
        <div className="text-[7.5px] font-black text-text-muted uppercase tracking-widest border-b border-black/5 dark:border-white/5 pb-1">
          PRESETS DE REFERENCIA POR DEFECTO
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className={`p-3.5 rounded-3xl text-left border cursor-pointer transition-all duration-200 flex flex-col justify-between gap-1 bg-white dark:bg-surface shadow-[0_8px_30px_rgba(0,0,0,0.03)] dark:shadow-none ${
                selectedId === preset.id
                  ? 'border-accent/40 bg-accent/[0.01] shadow-[0_8px_30px_rgba(255,140,0,0.08)]'
                  : 'border-black/5 dark:border-white/5 hover:border-accent/20'
              }`}
            >
              <div className="flex justify-between items-center w-full min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <img 
                    src={getPresetIconUrl(preset)} 
                    alt="" 
                    className="w-3.5 h-3.5 object-contain flex-shrink-0 preset-icon-image" 
                  />
                  <span className={`text-[9px] font-black uppercase truncate ${selectedId === preset.id ? 'text-accent' : 'text-text'}`}>{preset.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Pencil 
                    className="w-3 h-3 text-text-muted hover:text-accent cursor-pointer transition-colors" 
                    onClick={e => { 
                      e.stopPropagation(); 
                      setEditPresetId(preset.id); 
                      setEditPresetName(preset.name);
                      setEditPresetNameInput(preset.name);
                      setEditDescription(descriptionOverrides[preset.id] || preset.description); 
                      setEditPresetIcon(preset.icon || 'custom_1');
                    }} 
                  />
                  {selectedId === preset.id && <Check className="w-3 h-3 text-accent flex-shrink-0" />}
                </div>
              </div>
              <span className="text-[6.5px] text-text-muted leading-relaxed font-bold uppercase tracking-tight block mt-2">
                {descriptionOverrides[preset.id] || preset.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. CUSTOM PRESETS SECTION */}
      <div className="flex flex-col gap-2">
        <div className="text-[7.5px] font-black text-text-muted uppercase tracking-widest border-b border-black/5 dark:border-white/5 pb-1">
          MIS PRESETS PERSONALIZADOS
        </div>

        {customPresets.length === 0 ? (
          <div className="text-[8.5px] text-text-muted text-center py-3 border border-black/5 dark:border-white/5 rounded-2xl bg-white/[0.01] uppercase font-bold tracking-tight">
            NINGÚN PRESET PERSONALIZADO GUARDADO. APLIQUE SU CONF. Y PULSE + PRESET PARA GUARDAR.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {customPresets.map(preset => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className={`p-3.5 rounded-3xl text-left border cursor-pointer transition-all duration-200 flex flex-col justify-between gap-1 bg-white dark:bg-surface shadow-[0_8px_30px_rgba(0,0,0,0.03)] dark:shadow-none ${
                  selectedId === preset.id
                    ? 'border-accent/40 bg-accent/[0.01] shadow-[0_8px_30px_rgba(255,140,0,0.08)]'
                    : 'border-black/5 dark:border-white/5 hover:border-accent/20'
                }`}
              >
                <div className="flex justify-between items-center w-full min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <img 
                      src={getPresetIconUrl(preset)} 
                      alt="" 
                      className="w-3.5 h-3.5 object-contain flex-shrink-0 preset-icon-image" 
                    />
                    <span className={`text-[9px] font-black uppercase truncate ${selectedId === preset.id ? 'text-accent' : 'text-text'}`}>
                      {preset.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Pencil 
                      className="w-3 h-3 text-text-muted hover:text-accent cursor-pointer transition-colors" 
                      onClick={e => { 
                        e.stopPropagation(); 
                        setEditPresetId(preset.id); 
                        setEditPresetName(preset.name);
                        setEditPresetNameInput(preset.name);
                        setEditDescription(descriptionOverrides[preset.id] || preset.description); 
                        setEditPresetIcon(preset.icon || 'custom_1');
                      }} 
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        PresetStorage.delete(preset.id);
                        loadData();
                      }}
                      className="p-0.5 hover:text-danger text-text-muted transition-colors cursor-pointer"
                      title="Eliminar Preset"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    {selectedId === preset.id && <Check className="w-3 h-3 text-accent flex-shrink-0" />}
                  </div>
                </div>
                <span className="text-[6.5px] text-text-muted leading-relaxed font-bold uppercase tracking-tight block mt-2">
                  {descriptionOverrides[preset.id] || preset.description}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* --- ALL MODALS (GORGEOUS GLASSMORPHISM DESIGN SYSTEM MATCHING THE AUDIO CONSOLE) --- */}

      {/* Modal 1: Edit Preset */}
      {editPresetId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-[#11141c]/95 border border-black/10 dark:border-white/10 rounded-xl p-6 w-full max-w-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)] select-none">
            <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-3 mb-4">
              <h3 className="text-[11px] font-black text-accent tracking-widest uppercase font-mono">
                EDITAR PRESET: {editPresetName}
              </h3>
            </div>
            <div className="space-y-4">
              {editPresetId.startsWith('custom-') && (
                <div className="flex flex-col gap-1">
                  <label className="text-[7.5px] text-text-muted uppercase tracking-wider font-bold">NOMBRE DEL PRESET</label>
                  <input
                    type="text"
                    value={editPresetNameInput}
                    onChange={e => setEditPresetNameInput(e.target.value)}
                    className="w-full bg-black/5 dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-xl p-2.5 text-[9.5px] font-mono text-white outline-none focus:border-accent/40 transition-colors uppercase"
                    placeholder="MI PRESET DE MEZCLA"
                    required
                  />
                </div>
              )}
              <div className="flex flex-col gap-1">
                <label className="text-[7.5px] text-text-muted uppercase tracking-wider font-bold">DESCRIPCIÓN ACÚSTICA</label>
                <textarea
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className="w-full bg-black/5 dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-xl p-3 text-[9.5px] font-mono text-white outline-none focus:border-accent/40 transition-colors uppercase leading-normal"
                  rows={4}
                  placeholder="ESCRIBE LA NOTA DE DESCRIPCIÓN..."
                />
              </div>
              {editPresetId.startsWith('custom-') && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[7.5px] text-text-muted uppercase tracking-wider font-bold">SELECCIONAR ICONO</label>
                  <div className="flex gap-2">
                    {USER_ICONS.map(icon => (
                      <button
                        key={icon.id}
                        type="button"
                        onClick={() => setEditPresetIcon(icon.id)}
                        className={`p-2 rounded-xl border flex items-center justify-center cursor-pointer transition-all ${
                          editPresetIcon === icon.id
                            ? 'border-accent bg-accent/10 shadow-[0_0_8px_rgba(255,140,0,0.3)]'
                            : 'border-black/5 dark:border-white/5 bg-black/5 dark:bg-black/20 hover:border-black/20 dark:hover:border-white/20'
                        }`}
                      >
                        <img src={`/preset-icons/${icon.id}.svg`} alt={icon.name} className="w-5 h-5 object-contain flex-shrink-0 preset-icon-image" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  onClick={() => setEditPresetId('')} 
                  className="px-4 py-1.5 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/[0.03] text-text-soft hover:text-text transition-colors text-[8.5px] font-black tracking-widest uppercase font-mono cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  onClick={handleEditPresetSave}
                  className="px-4 py-1.5 rounded-xl bg-accent text-black font-black hover:bg-accent-soft hover:text-accent transition-all text-[8.5px] tracking-widest uppercase font-mono cursor-pointer shadow-[0_0_15px_rgba(255,140,0,0.4)] hover:shadow-none"
                >
                  GUARDAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Room Notes */}
      {editRoomId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-[#11141c]/95 border border-black/10 dark:border-white/10 rounded-xl p-6 w-full max-w-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)] select-none">
            <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-3 mb-4">
              <h3 className="text-[11px] font-black text-accent tracking-widest uppercase font-mono">
                EDITAR DESCRIPCIÓN SALA: {editRoomName}
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[7.5px] text-text-muted uppercase tracking-wider font-bold">DESCRIPCIÓN DE LA SALA</label>
                <textarea
                  value={editRoomNotes}
                  onChange={e => setEditRoomNotes(e.target.value)}
                  className="w-full bg-black/5 dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-xl p-3 text-[9.5px] font-mono text-white outline-none focus:border-accent/40 transition-colors uppercase leading-normal"
                  rows={4}
                  placeholder="ESCRIBE LA NOTA DE LA SALA..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  onClick={() => setEditRoomId('')} 
                  className="px-4 py-1.5 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/[0.03] text-text-soft hover:text-text transition-colors text-[8.5px] font-black tracking-widest uppercase font-mono cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  onClick={handleEditRoomSave}
                  className="px-4 py-1.5 rounded-xl bg-accent text-black font-black hover:bg-accent-soft hover:text-accent transition-all text-[8.5px] tracking-widest uppercase font-mono cursor-pointer shadow-[0_0_15px_rgba(255,140,0,0.4)] hover:shadow-none"
                >
                  GUARDAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Add Custom Preset */}
      {showAddPreset && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-[#11141c]/95 border border-black/10 dark:border-white/10 rounded-xl p-6 w-full max-w-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)] select-none">
            <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-3 mb-4">
              <h3 className="text-[11px] font-black text-accent tracking-widest uppercase font-mono">
                GUARDAR PRESET ACTUAL
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[7.5px] text-text-muted uppercase tracking-wider font-bold">NOMBRE DEL PRESET</label>
                <input
                  type="text"
                  value={newPresetName}
                  onChange={e => setNewPresetName(e.target.value)}
                  className="w-full bg-black/5 dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-xl p-2.5 text-[9.5px] font-mono text-white outline-none focus:border-accent/40 transition-colors uppercase"
                  placeholder="MI PRESET DE MEZCLA"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[7.5px] text-text-muted uppercase tracking-wider font-bold">DESCRIPCIÓN O NOTAS</label>
                <textarea
                  value={newPresetDescription}
                  onChange={e => setNewPresetDescription(e.target.value)}
                  className="w-full bg-black/5 dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-xl p-3 text-[9.5px] font-mono text-white outline-none focus:border-accent/40 transition-colors uppercase leading-normal"
                  rows={3}
                  placeholder="EXPLICACIÓN DE LA CURVA (GRAVES REALZADOS...)"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[7.5px] text-text-muted uppercase tracking-wider font-bold">SELECCIONAR ICONO</label>
                <div className="flex gap-2">
                  {USER_ICONS.map(icon => (
                    <button
                      key={icon.id}
                      type="button"
                      onClick={() => setNewPresetIcon(icon.id)}
                      className={`p-2 rounded-xl border flex items-center justify-center cursor-pointer transition-all ${
                        newPresetIcon === icon.id
                          ? 'border-accent bg-accent/10 shadow-[0_0_8px_rgba(255,140,0,0.3)]'
                          : 'border-black/5 dark:border-white/5 bg-black/5 dark:bg-black/20 hover:border-black/20 dark:hover:border-white/20'
                      }`}
                    >
                      <img src={`/preset-icons/${icon.id}.svg`} alt={icon.name} className="w-5 h-5 object-contain flex-shrink-0 preset-icon-image" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  onClick={() => setShowAddPreset(false)} 
                  className="px-4 py-1.5 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/[0.03] text-text-soft hover:text-text transition-colors text-[8.5px] font-black tracking-widest uppercase font-mono cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  onClick={handleAddPreset}
                  className="px-4 py-1.5 rounded-xl bg-accent text-black font-black hover:bg-accent-soft hover:text-accent transition-all text-[8.5px] tracking-widest uppercase font-mono cursor-pointer shadow-[0_0_15px_rgba(255,140,0,0.4)] hover:shadow-none"
                >
                  GUARDAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Add Room Profile */}
      {showAddRoom && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-[#11141c]/95 border border-black/10 dark:border-white/10 rounded-xl p-6 w-full max-w-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)] select-none">
            <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-3 mb-4">
              <h3 className="text-[11px] font-black text-accent tracking-widest uppercase font-mono">
                GUARDAR CONFIG. COMO NUEVA SALA
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[7.5px] text-text-muted uppercase tracking-wider font-bold">NOMBRE DE LA SALA</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={e => setNewRoomName(e.target.value)}
                  className="w-full bg-black/5 dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-xl p-2.5 text-[9.5px] font-mono text-white outline-none focus:border-accent/40 transition-colors uppercase"
                  placeholder="CONTROL ROOM C / MI HABITACIÓN"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[7.5px] text-text-muted uppercase tracking-wider font-bold">DESCRIPCIÓN DE LA ACÚSTICA</label>
                <textarea
                  value={newRoomDescription}
                  onChange={e => setNewRoomDescription(e.target.value)}
                  className="w-full bg-black/5 dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-xl p-3 text-[9.5px] font-mono text-white outline-none focus:border-accent/40 transition-colors uppercase leading-normal"
                  rows={3}
                  placeholder="NOTAS DE CALIBRACIÓN DE ESTE ESPACIO"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  onClick={() => setShowAddRoom(false)} 
                  className="px-4 py-1.5 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/[0.03] text-text-soft hover:text-text transition-colors text-[8.5px] font-black tracking-widest uppercase font-mono cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  onClick={handleAddRoom}
                  className="px-4 py-1.5 rounded-xl bg-accent text-black font-black hover:bg-accent-soft hover:text-accent transition-all text-[8.5px] tracking-widest uppercase font-mono cursor-pointer shadow-[0_0_15px_rgba(255,140,0,0.4)] hover:shadow-none"
                >
                  GUARDAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
