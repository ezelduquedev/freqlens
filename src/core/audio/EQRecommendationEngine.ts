export interface SuggestedBand {
  id: string;
  frequency: number;
  type: BiquadFilterType;
  suggestedGain: number;
  q: number;
  reason: string;
}

export class EQRecommendationEngine {
  /**
   * Genera recomendaciones de ganancia de EQ basadas en la respuesta de frecuencia medida.
   * La corrección es suave y limitada rígidamente a ±6 dB para garantizar la estabilidad acústica.
   */
  public static calculate(measuredResponse: number[], frequencies: number[]): SuggestedBand[] {
    const cleanResponse = measuredResponse.map(v => (v === -Infinity || isNaN(v)) ? -100 : v);
    
    // Nivel base promedio de la sala
    const totalSum = cleanResponse.reduce((a, b) => a + b, 0);
    const baseline = cleanResponse.length > 0 ? (totalSum / cleanResponse.length) : -45;

    // Frecuencias fijas de las bandas de FreqLens
    const targetBands = [
      { id: 'hpf', type: 'highpass' as BiquadFilterType, frequency: 30, q: 0.707, defaultReason: 'Filtro paso alto para limpiar subgraves inaudibles e interferencias mecánicas.' },
      { id: 'low-shelf', type: 'lowshelf' as BiquadFilterType, frequency: 100, q: 0.707, defaultReason: 'Control de graves para atenuar resonancias retumbantes en la base.' },
      { id: 'mid-1', type: 'peaking' as BiquadFilterType, frequency: 500, q: 1.0, defaultReason: 'Control de fango acústico y reflexiones de pared baja.' },
      { id: 'mid-2', type: 'peaking' as BiquadFilterType, frequency: 2000, q: 1.0, defaultReason: 'Control de presencia vocal y definición en rango medio.' },
      { id: 'high-shelf', type: 'highshelf' as BiquadFilterType, frequency: 8000, q: 0.707, defaultReason: 'Brillo tonal y compensación por absorción del aire.' }
    ];

    return targetBands.map(band => {
      const index = this.findClosestFrequencyIndex(frequencies, band.frequency);
      const measuredVal = cleanResponse[index] !== undefined ? cleanResponse[index] : baseline;
      
      // La desviación respecto al promedio
      const deviation = measuredVal - baseline;
      
      // Corrección inversa: picos se atenúan, valles se compensan
      let correction = -deviation;

      // El HPF (High Pass Filter) no usa ganancia en Web Audio API (es un corte),
      // pero sugerimos un corte de frecuencia recomendado o ganancia 0.
      let suggestedGain = 0;
      let reason = band.defaultReason;

      if (band.id !== 'hpf') {
        // Limitar la corrección rigurosamente a un máximo de ±6 dB
        suggestedGain = Math.max(-6.0, Math.min(6.0, correction));
        
        // Suavizar las ganancias (redondear a un decimal)
        suggestedGain = Math.round(suggestedGain * 10) / 10;
        
        // Personalizar motivos en base al resultado
        if (band.id === 'low-shelf') {
          if (suggestedGain < -1.5) {
            reason = `Reducción de ${Math.abs(suggestedGain)} dB para mitigar retumbes de baja frecuencia (Room Boom) en 100 Hz.`;
          } else if (suggestedGain > 1.5) {
            reason = `Refuerzo de ${suggestedGain} dB para compensar la falta de respuesta y pegada en graves.`;
          }
        } else if (band.id === 'mid-1') {
          if (suggestedGain < -1.5) {
            reason = `Corte de ${Math.abs(suggestedGain)} dB para eliminar reflexiones enturbiadas y "fango" en 500 Hz.`;
          } else if (suggestedGain > 1.5) {
            reason = `Aumento de ${suggestedGain} dB para recuperar el cuerpo armónico en medios-bajos.`;
          }
        } else if (band.id === 'mid-2') {
          if (suggestedGain < -1.5) {
            reason = `Suavizado de ${Math.abs(suggestedGain)} dB para atenuar dureza auditiva en la zona crítica del oído (2 kHz).`;
          } else if (suggestedGain > 1.5) {
            reason = `Realce de ${suggestedGain} dB para mejorar la definición del habla e inteligibilidad de instrumentos.`;
          }
        } else if (band.id === 'high-shelf') {
          if (suggestedGain < -1.5) {
            reason = `Corte suave de ${Math.abs(suggestedGain)} dB en agudos para compensar la fatiga por salas reflectantes.`;
          } else if (suggestedGain > 1.5) {
            reason = `Compensación de brillo de +${suggestedGain} dB en agudos para contrarrestar la absorción de aire.`;
          }
        }
      } else {
        // Para HPF sugerimos la frecuencia óptima basada en los graves medidos
        // Si hay demasiado subgrave por debajo de 40Hz, subimos la frecuencia a 35 o 40Hz
        const subBassIndex = this.findClosestFrequencyIndex(frequencies, 30);
        const subBassVal = cleanResponse[subBassIndex] || baseline;
        if (subBassVal - baseline > 4) {
          reason = 'Filtro corte de graves HPF sugerido a 40 Hz para eliminar ruidos mecánicos persistentes.';
        }
      }

      return {
        id: band.id,
        frequency: band.frequency,
        type: band.type,
        suggestedGain,
        q: band.q,
        reason
      };
    });
  }

  private static findClosestFrequencyIndex(frequencies: number[], target: number): number {
    return frequencies.reduce((prev, curr, idx) => 
      Math.abs(curr - target) < Math.abs(frequencies[prev] - target) ? idx : prev
    , 0);
  }
}
