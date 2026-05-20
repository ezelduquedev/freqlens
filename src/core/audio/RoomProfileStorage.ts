import { type AcousticIssue } from './RoomAnalysisEngine';

export interface RoomProfile {
  id: string;
  name: string;
  date: string;
  timestamp: number;
  averageRMS: number;
  acousticRating: 'Excelente' | 'Buena' | 'Tratable' | 'Crítica';
  issues: AcousticIssue[];
  eqValues: { [bandId: string]: number };
  frequencyResponse?: number[];
  notes?: string;
}

export class RoomProfileStorage {
  private static STORAGE_KEY = 'freqlens_room_profiles';

  /**
   * Guarda un nuevo perfil de calibración de sala en el almacenamiento local.
   */
  public static saveProfile(profile: RoomProfile): void {
    const profiles = this.getAllProfiles();
    const index = profiles.findIndex(p => p.id === profile.id || p.name.toLowerCase() === profile.name.toLowerCase());
    
    if (index >= 0) {
      profiles[index] = profile; // Overwrite
    } else {
      profiles.unshift(profile); // Add to beginning (newest first)
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(profiles));
  }

  /**
   * Recupera todos los perfiles de sala guardados.
   */
  public static getAllProfiles(): RoomProfile[] {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) {
      return this.getMockProfiles(); // Mock data for gorgeous first-impression UI
    }
    try {
      const list = JSON.parse(raw) as RoomProfile[];
      let mutated = false;
      const updated = list.map(p => {
        if (p.name.toUpperCase().includes('UCADEMY')) {
          mutated = true;
          return {
            ...p,
            name: 'Master Control Room B',
            notes: p.notes?.toUpperCase().includes('UCADEMY')
              ? 'Estudio de producción principal con paneles acústicos absorbentes en primeras reflexiones.'
              : p.notes
          };
        }
        return p;
      });

      if (mutated) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    } catch {
      return this.getMockProfiles();
    }
  }

  /**
   * Obtiene un perfil específico por ID.
   */
  public static getProfile(id: string): RoomProfile | null {
    const profiles = this.getAllProfiles();
    return profiles.find(p => p.id === id) || null;
  }

  /**
   * Elimina un perfil específico.
   */
  public static deleteProfile(id: string): void {
    const profiles = this.getAllProfiles();
    const updated = profiles.filter(p => p.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
  }

  /**
   * Genera perfiles simulados (Mock) para poblar inicialmente la interfaz.
   * Esto garantiza un look "profesional y pulido" desde la primera ejecución.
   */
  private static getMockProfiles(): RoomProfile[] {
    return [
      {
        id: 'mock-1',
        name: 'Master Control Room B',
        date: '19/05/2026',
        timestamp: Date.now() - 3600000 * 2, // 2 hours ago
        averageRMS: -42.8,
        acousticRating: 'Buena',
        issues: [
          {
            frequency: 92,
            deviation: 3.4,
            type: 'resonance',
            message: 'Resonancia sutil detectada.',
            description: 'Compensación recomendada en frecuencias graves para mejorar el monitoreo.'
          }
        ],
        eqValues: { 'hpf': 25, 'low-shelf': -1.8, 'mid-1': 0.5, 'mid-2': 0, 'high-shelf': 0.5 },
        notes: 'Sala de control principal con respuesta acústica optimizada para monitoreo de referencia.'
      },
      {
        id: 'mock-2',
        name: 'Dormitorio / Cama',
        date: '18/05/2026',
        timestamp: Date.now() - 3600000 * 24, // 1 day ago
        averageRMS: -48.5,
        acousticRating: 'Tratable',
        issues: [
          {
            frequency: 125,
            deviation: 5.6,
            type: 'resonance',
            message: 'Desviación en bajas frecuencias.',
            description: 'Presencia de rebotes acústicos comunes en espacios habitacionales sin tratar.'
          }
        ],
        eqValues: { 'hpf': 40, 'low-shelf': -4.5, 'mid-1': -2.0, 'mid-2': 1.2, 'high-shelf': 4.0 },
        notes: 'Entorno de escucha no tratado. Se sugiere corrección paramétrica para balancear la mezcla.'
      }
    ];
  }
}
