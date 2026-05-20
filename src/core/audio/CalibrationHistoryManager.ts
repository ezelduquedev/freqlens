import { type RoomProfile } from './RoomProfileStorage';

export interface ComparisonResult {
  bandId: string;
  frequency: number;
  gainDiff: number;
  message: string;
}

export class CalibrationHistoryManager {
  /**
   * Compara dos perfiles acústicos de sala diferentes.
   * Calcula la diferencia de ganancia y genera descripciones del balance relativo.
   */
  public static compare(profileA: RoomProfile, profileB: RoomProfile): ComparisonResult[] {
    const bands = ['hpf', 'low-shelf', 'mid-1', 'mid-2', 'high-shelf'];
    const frequencies: Record<string, number> = {
      'hpf': 30,
      'low-shelf': 100,
      'mid-1': 500,
      'mid-2': 2000,
      'high-shelf': 8000
    };

    return bands.map(bandId => {
      const gainA = profileA.eqValues[bandId] || 0;
      const gainB = profileB.eqValues[bandId] || 0;
      const gainDiff = gainA - gainB;

      let message = 'Respuesta similar';
      if (gainDiff > 1.5) {
        message = `${profileA.name} requiere más atenuación/realce positivo (+${gainDiff.toFixed(1)} dB) que ${profileB.name}.`;
      } else if (gainDiff < -1.5) {
        message = `${profileA.name} requiere menos atenuación/realce acústico (${gainDiff.toFixed(1)} dB) que ${profileB.name}.`;
      }

      return {
        bandId,
        frequency: frequencies[bandId] || 100,
        gainDiff: Math.round(gainDiff * 10) / 10,
        message
      };
    });
  }

  /**
   * Genera un resumen narrativo acústico en español sobre el estado del espacio.
   */
  public static getAcousticSummary(profile: RoomProfile): string {
    const rating = profile.acousticRating;
    const issueCount = profile.issues.length;

    if (rating === 'Excelente') {
      return `La sala "${profile.name}" presenta una respuesta acústica excepcional. No se requieren tratamientos correctivos mecánicos urgentes; las reflexiones tempranas están perfectamente controladas.`;
    }

    if (rating === 'Buena') {
      return `La sala "${profile.name}" tiene un comportamiento acústico balanceado. Se identificaron pequeñas resonancias residuales (${issueCount} detectadas), pero pueden corregirse de forma digital mediante las curvas recomendadas.`;
    }

    if (rating === 'Tratable') {
      return `El espacio presenta problemas de respuesta modal moderados en bajas frecuencias. Se recomienda encarecidamente instalar trampas de graves en esquinas o reposicionar los monitores de estudio para reducir el fango modal.`;
    }

    // Critica
    return `¡Alerta acústica crítica! La respuesta de frecuencia de "${profile.name}" presenta desviaciones severas que alteran por completo las decisiones de mezcla. Requiere paneles acústicos absorbentes en primeras reflexiones y trampas de graves masivas.`;
  }
}
