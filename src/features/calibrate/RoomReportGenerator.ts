import type { RoomAnalysisResult } from '../../core/audio/RoomAnalysisEngine'
import type { SuggestedBand } from '../../core/audio/EQRecommendationEngine'
import type { EQBand } from '../../core/audio/AdaptiveEQManager'

export interface ReportData {
  roomName: string
  roomNotes?: string
  signalType?: 'sweep' | 'pink'
  analysis: RoomAnalysisResult
  recommendations: SuggestedBand[]
  currentBands?: EQBand[]
  advisorAccuracy?: number
  advisorStatus?: string
  timestamp: Date
}

function ratingColor(r: string) {
  return r === 'Excelente' ? '#15803d' : r === 'Buena' ? '#b45309' : r === 'Tratable' ? '#c2410c' : '#b91c1c'
}
function ratingBg(r: string) {
  return r === 'Excelente' ? '#dcfce7' : r === 'Buena' ? '#fef3c7' : r === 'Tratable' ? '#ffedd5' : '#fee2e2'
}

function gainLabel(g: number) {
  return g > 0 ? `+${g.toFixed(1)} dB` : `${g.toFixed(1)} dB`
}
function gainColor(g: number) {
  return g > 0.5 ? '#c2410c' : g < -0.5 ? '#1d4ed8' : '#374151'
}

function bandDisplayName(id: string) {
  const m: Record<string, string> = {
    'hpf': 'HPF (Paso Alto)',
    'low-shelf': 'Low Shelf',
    'mid-1': 'Mid-Low (500 Hz)',
    'mid-2': 'Mid-High (2 kHz)',
    'high-shelf': 'High Shelf',
  }
  return m[id] ?? id
}

function issueTypeLabel(t: string) {
  return t === 'resonance' ? 'Resonancia' : t === 'cancellation' ? 'Cancelación' : 'Neutro'
}
function issueBadgeStyle(t: string) {
  return t === 'resonance'
    ? 'background:#fee2e2;color:#991b1b;border:1px solid #fca5a5;'
    : t === 'cancellation'
    ? 'background:#dbeafe;color:#1e40af;border:1px solid #93c5fd;'
    : 'background:#d1fae5;color:#065f46;border:1px solid #6ee7b7;'
}

function miniBar(gain: number): string {
  const max = 4
  const pct = Math.min(100, (Math.abs(gain) / max) * 100)
  const color = gain > 0.5 ? '#ea580c' : gain < -0.5 ? '#2563eb' : '#9ca3af'
  const side = gain >= 0 ? 'left:50%' : `right:50%;`
  return `
    <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
      <div style="flex:1;height:8px;background:#e5e7eb;border-radius:4px;position:relative;overflow:hidden;">
        <div style="position:absolute;top:0;height:100%;${side};width:${pct/2}%;background:${color};border-radius:4px;"></div>
        <div style="position:absolute;left:50%;top:0;width:1px;height:100%;background:#9ca3af;"></div>
      </div>
      <span style="font-family:monospace;font-size:12px;font-weight:700;color:${color};min-width:52px;">${gainLabel(gain)}</span>
    </div>`
}

export function generateRoomReportHTML(data: ReportData): string {
  const { roomName, roomNotes, signalType, analysis, recommendations, currentBands, advisorAccuracy, advisorStatus, timestamp } = data
  const rc = ratingColor(analysis.acousticRating)
  const rbg = ratingBg(analysis.acousticRating)
  const dateStr = timestamp.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  const signalLabel = signalType === 'pink' ? 'Ruido Rosa Voss-McCartney' : signalType === 'sweep' ? 'Barrido Senoidal Logarítmico (20 Hz → 20 kHz)' : 'No especificada'

  const bandRows = [
    { label: 'Sub-Graves', range: '20 – 60 Hz',    avg: analysis.bandAverages.subBass  },
    { label: 'Graves',     range: '60 – 250 Hz',   avg: analysis.bandAverages.bass     },
    { label: 'Medios-Bajos', range: '250 – 500 Hz', avg: analysis.bandAverages.lowMids },
    { label: 'Medios',     range: '500 – 4.000 Hz', avg: analysis.bandAverages.mids    },
    { label: 'Agudos',     range: '4.000 – 20.000 Hz', avg: analysis.bandAverages.highs },
  ]

  const issuesHTML = analysis.issues.map(issue => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;">
        <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;${issueBadgeStyle(issue.type)}">${issueTypeLabel(issue.type)}</span>
      </td>
      <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-family:monospace;font-size:12px;color:#374151;">${issue.frequency} Hz</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-weight:600;color:#111827;font-size:13px;">${issue.message}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;max-width:240px;">${issue.description}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-family:monospace;font-size:12px;font-weight:700;color:${issue.deviation > 0 ? '#c2410c' : issue.deviation < 0 ? '#1d4ed8' : '#374151'};">${issue.deviation > 0 ? '+' : ''}${issue.deviation.toFixed(1)} dB</td>
    </tr>`).join('')

  const recHTML = recommendations.map(rec => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-weight:700;color:#111827;font-size:13px;">${bandDisplayName(rec.id)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-family:monospace;font-size:12px;color:#374151;">${rec.frequency} Hz</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;">${rec.reason}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-weight:700;font-family:monospace;color:${gainColor(rec.suggestedGain)};font-size:13px;">${gainLabel(rec.suggestedGain)}</td>
    </tr>`).join('')

  const currentBandsHTML = currentBands ? currentBands.map(b => `
    <tr>
      <td style="padding:8px 14px;border-bottom:1px solid #e5e7eb;font-weight:600;color:#374151;font-size:12px;">${bandDisplayName(b.id)}</td>
      <td style="padding:8px 14px;border-bottom:1px solid #e5e7eb;font-family:monospace;font-size:12px;color:#374151;">${b.frequency} Hz</td>
      <td style="padding:8px 14px;border-bottom:1px solid #e5e7eb;">${miniBar(b.gain)}</td>
    </tr>`).join('') : ''

  const advisorHTML = (advisorAccuracy !== undefined && advisorStatus) ? `
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px 20px;margin-bottom:24px;display:flex;align-items:center;gap:16px;">
      <div style="text-align:center;min-width:60px;">
        <div style="font-size:28px;font-weight:900;color:#15803d;font-family:monospace;">${advisorAccuracy}%</div>
        <div style="font-size:10px;color:#166534;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">Precisión</div>
      </div>
      <div>
        <div style="font-size:14px;font-weight:800;color:#15803d;margin-bottom:4px;">Asesor Acústico: ${advisorStatus}</div>
        <div style="font-size:12px;color:#166534;">Índice de Compensación Acústica al momento de generar el informe.</div>
      </div>
    </div>` : ''

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>FreqLens — Informe de Sala: ${roomName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#ffffff;color:#111827;font-family:'Inter',sans-serif;font-size:14px;line-height:1.6;}
  table{border-collapse:collapse;width:100%;}
  th{text-align:left;padding:10px 14px;background:#f9fafb;border-bottom:2px solid #e5e7eb;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;}
  h2{font-size:15px;font-weight:800;color:#111827;margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid #f97316;display:flex;align-items:center;gap:8px;}
  h2 span.dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#f97316;}
  .section{margin-bottom:32px;}
  .card{background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px 20px;}
  @media print{
    @page{margin:18mm 16mm;size:A4;}
    body{font-size:12px;}
    .no-print{display:none!important;}
    tr{page-break-inside:avoid;}
  }
</style>
</head>
<body style="max-width:900px;margin:0 auto;padding:32px 28px;">

<!-- PRINT BUTTON -->
<div class="no-print" style="position:fixed;top:12px;right:12px;z-index:999;">
  <button onclick="window.print()" style="background:#f97316;color:#fff;border:none;padding:10px 22px;border-radius:8px;font-family:'Inter',sans-serif;font-weight:700;font-size:13px;cursor:pointer;box-shadow:0 2px 8px rgba(249,115,22,.35);">
    🖨 Imprimir / Guardar PDF
  </button>
</div>

<!-- HEADER -->
<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid #f97316;">
  <div style="display:flex;align-items:center;gap:14px;">
    <svg width="48" height="48" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="22" cy="22" r="20" stroke="#f97316" stroke-width="2.5" fill="none"/>
      <path d="M6 22 Q11 10 16 22 Q21 34 26 22 Q31 10 38 22" stroke="#f97316" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <circle cx="22" cy="22" r="3" fill="#f97316"/>
    </svg>
    <div>
      <div style="font-size:24px;font-weight:900;color:#111827;letter-spacing:-.02em;">FreqLens</div>
      <div style="font-size:11px;color:#9ca3af;font-family:'JetBrains Mono',monospace;letter-spacing:.07em;text-transform:uppercase;">Informe Técnico de Calibración Acústica</div>
    </div>
  </div>
  <div style="text-align:right;">
    <div style="font-size:13px;font-weight:600;color:#374151;">${dateStr}</div>
    <div style="font-size:12px;color:#9ca3af;font-family:'JetBrains Mono',monospace;">${timeStr}</div>
    <div style="margin-top:4px;font-size:10px;color:#d1d5db;font-family:monospace;">v3.0 · DAM TFG 2026 · Ezel A. Duque Arias</div>
  </div>
</div>

<!-- SALA + RATING -->
<div style="display:grid;grid-template-columns:1fr auto;gap:20px;margin-bottom:32px;align-items:start;">
  <div>
    <div style="font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">Perfil analizado</div>
    <div style="font-size:26px;font-weight:900;color:#111827;letter-spacing:-.02em;margin-bottom:8px;">${roomName}</div>
    ${roomNotes ? `<div style="font-size:13px;color:#6b7280;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px 14px;font-style:italic;">"${roomNotes}"</div>` : ''}
    <div style="margin-top:10px;font-size:12px;color:#6b7280;"><strong style="color:#374151;">Señal de prueba:</strong> ${signalLabel}</div>
  </div>
  <div style="background:${rbg};border:2px solid ${rc};border-radius:12px;padding:20px 28px;text-align:center;min-width:140px;">
    <div style="font-size:11px;color:${rc};font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">Rating acústico</div>
    <div style="font-size:28px;font-weight:900;color:${rc};font-family:'JetBrains Mono',monospace;">${analysis.acousticRating}</div>
    <div style="margin-top:8px;font-size:11px;color:${rc};opacity:.75;">RMS promedio</div>
    <div style="font-size:15px;font-weight:700;color:${rc};font-family:monospace;">${analysis.averageRMS.toFixed(1)} dBFS</div>
  </div>
</div>

${advisorHTML}

<!-- SECCIÓN 1: BANDAS -->
<div class="section">
  <h2><span class="dot"></span> Respuesta espectral por bandas</h2>
  <table>
    <thead><tr>
      <th>Banda</th><th>Rango frecuencial</th><th>Nivel promedio (dBFS)</th><th>Evaluación</th>
    </tr></thead>
    <tbody>
      ${bandRows.map(b => {
        const level = b.avg > -40 ? 'Alto' : b.avg > -55 ? 'Medio' : 'Bajo'
        const lvlColor = b.avg > -40 ? '#c2410c' : b.avg > -55 ? '#b45309' : '#374151'
        return `<tr>
          <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-weight:700;color:#111827;">${b.label}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-family:monospace;color:#374151;">${b.range}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-family:monospace;font-weight:700;color:#374151;">${b.avg.toFixed(1)} dBFS</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-weight:600;color:${lvlColor};">${level}</td>
        </tr>`
      }).join('')}
    </tbody>
  </table>
</div>

<!-- SECCIÓN 2: PROBLEMAS -->
<div class="section">
  <h2><span class="dot"></span> Problemas espectrales detectados</h2>
  <table>
    <thead><tr><th>Tipo</th><th>Frecuencia</th><th>Diagnóstico</th><th>Descripción técnica</th><th>Desviación</th></tr></thead>
    <tbody>${issuesHTML}</tbody>
  </table>
</div>

<!-- SECCIÓN 3: EQ SUGERIDA -->
<div class="section">
  <h2><span class="dot"></span> Curva correctiva EQ paramétrica sugerida (±4 dB)</h2>
  <table>
    <thead><tr><th>Banda EQ</th><th>Frecuencia central</th><th>Motivo técnico</th><th>Ganancia sugerida</th></tr></thead>
    <tbody>${recHTML}</tbody>
  </table>

  <!-- EQ Bar visual -->
  <div class="card" style="margin-top:16px;">
    <div style="font-size:11px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:16px;">Visualización de la curva correctiva</div>
    <div style="display:flex;align-items:flex-end;gap:10px;height:90px;justify-content:center;padding:0 8px;">
      ${recommendations.map(rec => {
        const h = Math.abs(rec.suggestedGain) / 4 * 70
        const color = rec.suggestedGain > 0.5 ? '#ea580c' : rec.suggestedGain < -0.5 ? '#2563eb' : '#9ca3af'
        const isUp = rec.suggestedGain >= 0
        const freqLabel = rec.frequency >= 1000 ? `${rec.frequency/1000}k` : `${rec.frequency}`
        return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;">
          <div style="font-size:10px;color:${color};font-family:monospace;font-weight:700;">${gainLabel(rec.suggestedGain)}</div>
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:${isUp ? 'flex-end' : 'flex-start'};height:70px;width:100%;position:relative;">
            <div style="position:absolute;top:50%;left:0;right:0;height:1px;background:#d1d5db;"></div>
            ${h > 0 ? `<div style="width:80%;height:${h}px;background:${color};border-radius:3px;opacity:.8;${isUp ? 'margin-top:auto' : 'margin-bottom:auto'}"></div>` : '<div style="width:2px;height:4px;background:#9ca3af;margin:auto;"></div>'}
          </div>
          <div style="font-size:10px;color:#6b7280;font-family:monospace;text-align:center;">${freqLabel} Hz</div>
        </div>`
      }).join('')}
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:10px;color:#9ca3af;font-family:monospace;padding:0 8px;">
      <span>-4 dB</span><span style="font-weight:700;color:#374151;">0 dB</span><span>+4 dB</span>
    </div>
  </div>
</div>

<!-- SECCIÓN 4: EQ ACTUAL (si hay datos) -->
${currentBandsHTML ? `
<div class="section">
  <h2><span class="dot"></span> Estado actual de los filtros DSP</h2>
  <div style="font-size:12px;color:#6b7280;margin-bottom:12px;">Valores de ganancia aplicados en los BiquadFilterNodes al momento de generar el informe.</div>
  <table>
    <thead><tr><th>Banda</th><th>Frecuencia</th><th>Ganancia aplicada</th></tr></thead>
    <tbody>${currentBandsHTML}</tbody>
  </table>
</div>` : ''}

<!-- FOOTER -->
<div style="border-top:1px solid #e5e7eb;padding-top:16px;margin-top:8px;display:flex;justify-content:space-between;align-items:center;">
  <div style="font-size:11px;color:#9ca3af;font-family:'JetBrains Mono',monospace;">FreqLens · Ezel Alexander Duque Arias · TFG DAM 2026</div>
  <div style="font-size:10px;color:#d1d5db;font-family:monospace;">Procesado en el navegador · Web Audio API · Sin backend</div>
</div>

</body>
</html>`
}

export function downloadRoomReport(data: ReportData): void {
  const html = generateRoomReportHTML(data)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const safe = data.roomName.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').toLowerCase()
  a.download = `FreqLens_Informe_${safe}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}