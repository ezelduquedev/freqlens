export interface AcousticIssue {
  frequency: number;
  deviation: number;
  type: 'resonance' | 'cancellation' | 'neutral';
  message: string;
  description: string;
}

export interface RoomAnalysisResult {
  averageRMS: number;
  acousticRating: 'Excelente' | 'Buena' | 'Tratable' | 'Crítica';
  issues: AcousticIssue[];
  bandAverages: {
    subBass: number;
    bass: number;
    lowMids: number;
    mids: number;
    highs: number;
  };
}

export class RoomAnalysisEngine {
  /**
   * Analiza la respuesta frecuencial medida en la sala.
   * Identifica picos de resonancia modal y cancelaciones.
   */
  public static analyze(measuredResponse: number[], frequencies: number[]): RoomAnalysisResult {
    // 1. Filtrar valores infinitos o corruptos
    const cleanResponse = measuredResponse.map(v => (v === -Infinity || isNaN(v)) ? -100 : v);
    
    // 2. Agrupar por bandas acústicas y calcular promedios
    let subBassSum = 0, subBassCount = 0;
    let bassSum = 0, bassCount = 0;
    let lowMidsSum = 0, lowMidsCount = 0;
    let midsSum = 0, midsCount = 0;
    let highsSum = 0, highsCount = 0;

    for (let i = 0; i < frequencies.length; i++) {
      const f = frequencies[i];
      const val = cleanResponse[i];

      if (f >= 20 && f < 60) {
        subBassSum += val;
        subBassCount++;
      } else if (f >= 60 && f < 250) {
        bassSum += val;
        bassCount++;
      } else if (f >= 250 && f < 500) {
        lowMidsSum += val;
        lowMidsCount++;
      } else if (f >= 500 && f < 4000) {
        midsSum += val;
        midsCount++;
      } else if (f >= 4000 && f <= 20000) {
        highsSum += val;
        highsCount++;
      }
    }

    const subBassAvg = subBassCount > 0 ? (subBassSum / subBassCount) : -60;
    const bassAvg = bassCount > 0 ? (bassSum / bassCount) : -60;
    const lowMidsAvg = lowMidsCount > 0 ? (lowMidsSum / lowMidsCount) : -60;
    const midsAvg = midsCount > 0 ? (midsSum / midsCount) : -60;
    const highsAvg = highsCount > 0 ? (highsSum / highsCount) : -60;

    // Calcular promedio total
    const totalSum = cleanResponse.reduce((a, b) => a + b, 0);
    const totalAvg = cleanResponse.length > 0 ? (totalSum / cleanResponse.length) : -60;

    // 3. Heurística para detectar problemas acústicos concretos
    const issues: AcousticIssue[] = [];

    // Problema 1: Exceso en Graves (Bass Boom) en salas pequeñas
    // Buscamos el pico máximo en el rango de graves (60Hz - 150Hz)
    let maxBassVal = -100;
    let maxBassFreq = 90;
    for (let i = 0; i < frequencies.length; i++) {
      const f = frequencies[i];
      if (f >= 60 && f <= 150) {
        if (cleanResponse[i] > maxBassVal) {
          maxBassVal = cleanResponse[i];
          maxBassFreq = Math.round(f);
        }
      }
    }

    const bassDeviation = maxBassVal - totalAvg;
    if (bassDeviation > 4) {
      issues.push({
        frequency: maxBassFreq,
        deviation: Math.round(bassDeviation * 10) / 10,
        type: 'resonance',
        message: `Exceso de graves a ${maxBassFreq} Hz (Efecto "Room Boom").`,
        description: 'Exceso de presión acústica en graves. Común por rebotes en esquinas o falta de trampas de graves.'
      });
    }

    // Problema 2: Resonancias molestas en medios (1kHz - 3kHz)
    let maxMidVal = -100;
    let maxMidFreq = 2000;
    for (let i = 0; i < frequencies.length; i++) {
      const f = frequencies[i];
      if (f >= 1000 && f <= 3000) {
        if (cleanResponse[i] > maxMidVal) {
          maxMidVal = cleanResponse[i];
          maxMidFreq = Math.round(f);
        }
      }
    }

    const midDeviation = maxMidVal - totalAvg;
    if (midDeviation > 3) {
      issues.push({
        frequency: maxMidFreq,
        deviation: Math.round(midDeviation * 10) / 10,
        type: 'resonance',
        message: `Resonancia estridente en ${maxMidFreq} Hz.`,
        description: 'Pico duro detectado en frecuencias medias. Causa fatiga auditiva rápida y confusión de voces.'
      });
    } else {
      // Si no hay resonancia dura, buscar una cancelación (valley) en la zona de cruce de medios (500Hz - 1.5kHz)
      let minMidVal = 0;
      let minMidFreq = 1000;
      for (let i = 0; i < frequencies.length; i++) {
        const f = frequencies[i];
        if (f >= 500 && f <= 1500) {
          if (cleanResponse[i] < minMidVal) {
            minMidVal = cleanResponse[i];
            minMidFreq = Math.round(f);
          }
        }
      }
      const midCancellation = minMidVal - totalAvg;
      if (midCancellation < -5) {
        issues.push({
          frequency: minMidFreq,
          deviation: Math.round(midCancellation * 10) / 10,
          type: 'cancellation',
          message: `Cancelación modal a ${minMidFreq} Hz (Comb Filtering).`,
          description: 'Pérdida de inteligibilidad en medios provocada por cancelaciones físicas de fase contra paredes cercanas.'
        });
      }
    }

    // Problema 3: Compensación de altas frecuencias (Atenuación natural)
    const highsDeviation = highsAvg - midsAvg;
    if (highsDeviation < -4) {
      issues.push({
        frequency: 10000,
        deviation: Math.round(highsDeviation * 10) / 10,
        type: 'cancellation',
        message: 'Caída de presencia y brillo (> 8 kHz).',
        description: 'Absorción excesiva del aire o materiales blandos (cortinas, alfombras) que apagan el brillo analítico de mezcla.'
      });
    }

    // Si no se detectan problemas específicos, agregar un diagnóstico neutral
    if (issues.length === 0) {
      issues.push({
        frequency: 1000,
        deviation: 0,
        type: 'neutral',
        message: 'Respuesta frecuencial sumamente equilibrada.',
        description: 'No se detectan resonancias agresivas ni cancelaciones críticas de energía en este espacio.'
      });
    }

    // 4. Calcular el Rating Acústico de la sala en base a la desviación máxima
    let maxAbsoluteDeviation = 0;
    issues.forEach(iss => {
      if (Math.abs(iss.deviation) > maxAbsoluteDeviation) {
        maxAbsoluteDeviation = Math.abs(iss.deviation);
      }
    });

    let rating: 'Excelente' | 'Buena' | 'Tratable' | 'Crítica' = 'Excelente';
    if (maxAbsoluteDeviation > 8) {
      rating = 'Crítica';
    } else if (maxAbsoluteDeviation > 5) {
      rating = 'Tratable';
    } else if (maxAbsoluteDeviation > 2) {
      rating = 'Buena';
    }

    return {
      averageRMS: Math.round(totalAvg * 10) / 10,
      acousticRating: rating,
      issues,
      bandAverages: {
        subBass: Math.round(subBassAvg * 10) / 10,
        bass: Math.round(bassAvg * 10) / 10,
        lowMids: Math.round(lowMidsAvg * 10) / 10,
        mids: Math.round(midsAvg * 10) / 10,
        highs: Math.round(highsAvg * 10) / 10,
      }
    };
  }
}
