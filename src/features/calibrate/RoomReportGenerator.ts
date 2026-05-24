import type { RoomAnalysisResult } from '../../core/audio/RoomAnalysisEngine'
import type { SuggestedBand } from '../../core/audio/EQRecommendationEngine'

export interface ReportData {
  roomName: string
  roomNotes: string
  signalType: 'sweep' | 'pink'
  analysis: RoomAnalysisResult
  recommendations: SuggestedBand[]
  timestamp: Date
}

function ratingColor(rating: string): string {
  switch (rating) {
    case 'Excelente': return '#30d158'
    case 'Buena':     return '#f59e0b'
    case 'Tratable':  return '#ff8c00'
    case 'Crítica':   return '#ff453a'
    default:          return '#9ba6b2'
  }
}

function gainBar(gain: number): string {
  const pct = Math.min(100, Math.abs(gain) / 4 * 100)
  const color = gain > 0 ? '#ff8c00' : gain < 0 ? '#00d4ff' : '#444'
  const label = gain > 0 ? `+${gain.toFixed(1)} dB` : `${gain.toFixed(1)} dB`
  const dir = gain >= 0 ? 'left' : 'right'
  return `
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="flex:1;height:6px;background:#1e2330;border-radius:3px;position:relative;">
        <div style="position:absolute;${dir}:50%;width:${pct / 2}%;height:100%;background:${color};border-radius:3px;"></div>
        <div style="position:absolute;left:50%;top:-2px;width:1px;height:10px;background:#333;"></div>
      </div>
      <span style="font-family:monospace;font-size:11px;color:${color};min-width:52px;text-align:right;font-weight:700;">${label}</span>
    </div>`
}

function bandLabel(id: string): string {
  const map: Record<string, string> = {
    'hpf': 'HPF',
    'low-shelf': 'Low Shelf',
    'mid-1': 'Mid-Low',
    'mid-2': 'Mid-High',
    'high-shelf': 'High Shelf',
  }
  return map[id] ?? id
}

function issueIcon(type: string): string {
  if (type === 'resonance') return '▲'
  if (type === 'cancellation') return '▼'
  return '●'
}

function issueColor(type: string): string {
  if (type === 'resonance') return '#ff453a'
  if (type === 'cancellation') return '#00d4ff'
  return '#30d158'
}

function signalLabel(sig: 'sweep' | 'pink'): string {
  return sig === 'sweep' ? 'Barrido Senoidal Logarítmico (20 Hz → 20 kHz)' : 'Ruido Rosa Voss-McCartney'
}

function bandRow(band: { label: string; freq: string; avg: number }): string {
  const pct = Math.min(100, Math.max(0, (band.avg + 80) / 80 * 100))
  const color = band.avg > -40 ? '#ff8c00' : band.avg > -55 ? '#f59e0b' : '#9ba6b2'
  return `
  <tr>
    <td style="padding:8px 12px;font-size:11px;color:#9ba6b2;font-weight:600;white-space:nowrap;">${band.label}</td>
    <td style="padding:8px 12px;font-size:11px;color:#6e7782;font-family:monospace;">${band.freq}</td>
    <td style="padding:8px 12px;width:100%;">
      <div style="background:#1e2330;border-radius:3px;height:5px;">
        <div style="width:${pct}%;height:100%;background:${color};border-radius:3px;"></div>
      </div>
    </td>
    <td style="padding:8px 12px;font-size:11px;font-family:monospace;color:${color};font-weight:700;white-space:nowrap;">${band.avg.toFixed(1)} dBFS</td>
  </tr>`
}

export function generateRoomReport(data: ReportData): string {
  const { roomName, roomNotes, signalType, analysis, recommendations, timestamp } = data
  const rc = ratingColor(analysis.acousticRating)
  const dateStr = timestamp.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

  const bands = [
    { label: 'Sub-Graves', freq: '20–60 Hz',    avg: analysis.bandAverages.subBass  },
    { label: 'Graves',     freq: '60–250 Hz',   avg: analysis.bandAverages.bass     },
    { label: 'Medios-Bajos', freq: '250–500 Hz', avg: analysis.bandAverages.lowMids },
    { label: 'Medios',     freq: '500–4000 Hz',  avg: analysis.bandAverages.mids    },
    { label: 'Agudos',     freq: '4k–20 kHz',   avg: analysis.bandAverages.highs   },
  ]

  const recRows = recommendations.map(rec => `
  <tr style="border-bottom:1px solid #1e2330;">
    <td style="padding:10px 14px;">
      <span style="font-size:11px;font-weight:800;color:#f4f7fb;font-family:monospace;letter-spacing:.03em;">${bandLabel(rec.id)}</span>
    </td>
    <td style="padding:10px 14px;font-family:monospace;font-size:11px;color:#9ba6b2;">${rec.frequency} Hz</td>
    <td style="padding:10px 14px;font-size:10px;color:#6e7782;max-width:220px;">${rec.reason}</td>
    <td style="padding:10px 14px;min-width:180px;">${gainBar(rec.suggestedGain)}</td>
  </tr>`).join('')

  const issueCards = analysis.issues.map(issue => `
  <div style="display:flex;gap:12px;background:#0e1118;border:1px solid #1e2330;border-radius:12px;padding:12px 16px;margin-bottom:8px;">
    <div style="font-size:16px;line-height:1;color:${issueColor(issue.type)};margin-top:2px;">${issueIcon(issue.type)}</div>
    <div>
      <div style="font-size:11.5px;font-weight:800;color:#f4f7fb;font-family:monospace;letter-spacing:.02em;margin-bottom:3px;">${issue.message}</div>
      <div style="font-size:10px;color:#6e7782;line-height:1.5;">${issue.description}</div>
      ${issue.deviation !== 0 ? `<div style="margin-top:4px;font-size:10px;font-family:monospace;color:${issueColor(issue.type)};">Desviación detectada: ${issue.deviation > 0 ? '+' : ''}${issue.deviation.toFixed(1)} dB a ${issue.frequency} Hz</div>` : ''}
    </div>
  </div>`).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>FreqLens — Informe de Calibración · ${roomName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#080a0f;color:#f4f7fb;font-family:'Inter',sans-serif;font-size:13px;line-height:1.6;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  @media print{body{background:#fff;color:#000;} .no-print{display:none;} .page-break{page-break-after:always;}}
</style>
</head>
<body>

<!-- PRINT BUTTON -->
<div class="no-print" style="position:fixed;top:16px;right:16px;z-index:999;display:flex;gap:8px;">
  <button onclick="window.print()" style="background:#ff8c00;color:#000;border:none;padding:10px 20px;border-radius:8px;font-family:monospace;font-weight:800;font-size:11px;letter-spacing:.08em;cursor:pointer;text-transform:uppercase;">⬇ Imprimir / Guardar PDF</button>
</div>

<div style="max-width:860px;margin:0 auto;padding:40px 24px;">

  <!-- HEADER -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;padding-bottom:24px;border-bottom:1px solid #1e2330;">
    <div style="display:flex;align-items:center;gap:14px;">
      <!-- FreqLens SVG Logo -->
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="22" cy="22" r="20" stroke="#ff8c00" stroke-width="2.5" fill="none"/>
        <path d="M6 22 Q11 10 16 22 Q21 34 26 22 Q31 10 38 22" stroke="#ff8c00" stroke-width="2" fill="none" stroke-linecap="round"/>
        <circle cx="22" cy="22" r="3" fill="#ff8c00"/>
      </svg>
      <div>
        <div style="font-size:20px;font-weight:800;letter-spacing:-.01em;color:#f4f7fb;">FreqLens</div>
        <div style="font-size:10px;color:#6e7782;font-family:'JetBrains Mono',monospace;letter-spacing:.08em;text-transform:uppercase;margin-top:1px;">Informe de Calibración Acústica</div>
      </div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:11px;color:#9ba6b2;font-family:'JetBrains Mono',monospace;">${dateStr}</div>
      <div style="font-size:11px;color:#6e7782;font-family:'JetBrains Mono',monospace;">${timeStr}</div>
      <div style="margin-top:6px;font-size:9px;color:#3d4451;font-family:monospace;letter-spacing:.05em;">v3.0 · DAM TFG 2026</div>
    </div>
  </div>

  <!-- SALA INFO + RATING -->
  <div style="display:grid;grid-template-columns:1fr auto;gap:20px;margin-bottom:32px;align-items:start;">
    <div>
      <div style="font-size:10px;color:#6e7782;font-family:'JetBrains Mono',monospace;letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px;">Perfil de sala analizado</div>
      <div style="font-size:22px;font-weight:800;color:#f4f7fb;letter-spacing:-.01em;margin-bottom:8px;">${roomName}</div>
      ${roomNotes ? `<div style="font-size:11.5px;color:#9ba6b2;background:#0e1118;border:1px solid #1e2330;border-radius:8px;padding:10px 14px;font-style:italic;">"${roomNotes}"</div>` : ''}
      <div style="margin-top:12px;font-size:10px;color:#6e7782;">
        <span style="color:#9ba6b2;font-weight:600;">Señal de prueba:</span> ${signalLabel(signalType)}
      </div>
    </div>
    <div style="background:#0e1118;border:1px solid #1e2330;border-radius:16px;padding:20px 28px;text-align:center;min-width:140px;">
      <div style="font-size:9px;color:#6e7782;font-family:'JetBrains Mono',monospace;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px;">Rating acústico</div>
      <div style="font-size:26px;font-weight:900;color:${rc};font-family:'JetBrains Mono',monospace;letter-spacing:.02em;">${analysis.acousticRating}</div>
      <div style="margin-top:8px;font-size:9px;color:#6e7782;font-family:monospace;">RMS promedio</div>
      <div style="font-size:13px;font-weight:700;color:#f4f7fb;font-family:monospace;">${analysis.averageRMS.toFixed(1)} dBFS</div>
    </div>
  </div>

  <!-- SECTION: RESPUESTA ESPECTRAL POR BANDAS -->
  <div style="margin-bottom:32px;">
    <div style="font-size:10px;color:#ff8c00;font-family:'JetBrains Mono',monospace;letter-spacing:.1em;text-transform:uppercase;margin-bottom:14px;display:flex;align-items:center;gap:8px;">
      <span style="display:inline-block;width:20px;height:1px;background:#ff8c00;vertical-align:middle;"></span>
      Respuesta espectral por bandas
    </div>
    <div style="background:#0d0f17;border:1px solid #1e2330;border-radius:14px;overflow:hidden;">
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="border-bottom:1px solid #1e2330;">
            <th style="padding:10px 12px;text-align:left;font-size:9px;color:#6e7782;font-family:'JetBrains Mono',monospace;letter-spacing:.08em;text-transform:uppercase;font-weight:600;">Banda</th>
            <th style="padding:10px 12px;text-align:left;font-size:9px;color:#6e7782;font-family:'JetBrains Mono',monospace;letter-spacing:.08em;text-transform:uppercase;font-weight:600;">Rango</th>
            <th style="padding:10px 12px;text-align:left;font-size:9px;color:#6e7782;font-family:'JetBrains Mono',monospace;letter-spacing:.08em;text-transform:uppercase;font-weight:600;">Nivel relativo</th>
            <th style="padding:10px 12px;text-align:right;font-size:9px;color:#6e7782;font-family:'JetBrains Mono',monospace;letter-spacing:.08em;text-transform:uppercase;font-weight:600;">Promedio</th>
          </tr>
        </thead>
        <tbody>${bands.map(bandRow).join('')}</tbody>
      </table>
    </div>
  </div>

  <!-- SECTION: PROBLEMAS DETECTADOS -->
  <div style="margin-bottom:32px;">
    <div style="font-size:10px;color:#ff8c00;font-family:'JetBrains Mono',monospace;letter-spacing:.1em;text-transform:uppercase;margin-bottom:14px;display:flex;align-items:center;gap:8px;">
      <span style="display:inline-block;width:20px;height:1px;background:#ff8c00;vertical-align:middle;"></span>
      Problemas espectrales detectados (${analysis.issues.length})
    </div>
    ${issueCards}
  </div>

  <!-- SECTION: EQ RECOMENDADA -->
  <div style="margin-bottom:32px;">
    <div style="font-size:10px;color:#ff8c00;font-family:'JetBrains Mono',monospace;letter-spacing:.1em;text-transform:uppercase;margin-bottom:14px;display:flex;align-items:center;gap:8px;">
      <span style="display:inline-block;width:20px;height:1px;background:#ff8c00;vertical-align:middle;"></span>
      Curva correctiva EQ paramétrica sugerida (±4 dB)
    </div>
    <div style="background:#0d0f17;border:1px solid #1e2330;border-radius:14px;overflow:hidden;">
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="border-bottom:1px solid #1e2330;">
            <th style="padding:10px 14px;text-align:left;font-size:9px;color:#6e7782;font-family:'JetBrains Mono',monospace;letter-spacing:.08em;text-transform:uppercase;font-weight:600;">Banda EQ</th>
            <th style="padding:10px 14px;text-align:left;font-size:9px;color:#6e7782;font-family:'JetBrains Mono',monospace;letter-spacing:.08em;text-transform:uppercase;font-weight:600;">Frecuencia</th>
            <th style="padding:10px 14px;text-align:left;font-size:9px;color:#6e7782;font-family:'JetBrains Mono',monospace;letter-spacing:.08em;text-transform:uppercase;font-weight:600;">Motivo técnico</th>
            <th style="padding:10px 14px;text-align:left;font-size:9px;color:#6e7782;font-family:'JetBrains Mono',monospace;letter-spacing:.08em;text-transform:uppercase;font-weight:600;">Ganancia sugerida</th>
          </tr>
        </thead>
        <tbody>${recRows}</tbody>
      </table>
    </div>

    <!-- EQ VISUAL BAR CHART -->
    <div style="margin-top:16px;background:#0d0f17;border:1px solid #1e2330;border-radius:14px;padding:20px 24px;">
      <div style="font-size:9px;color:#6e7782;font-family:monospace;letter-spacing:.08em;text-transform:uppercase;margin-bottom:16px;">Visualización de la curva correctiva</div>
      <div style="display:flex;align-items:flex-end;gap:12px;height:80px;justify-content:center;">
        ${recommendations.map(rec => {
          const h = Math.abs(rec.suggestedGain) / 4 * 70
          const color = rec.suggestedGain > 0 ? '#ff8c00' : rec.suggestedGain < 0 ? '#00d4ff' : '#333'
          const isUp = rec.suggestedGain >= 0
          return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;">
            <div style="font-size:9px;color:${color};font-family:monospace;font-weight:700;">${rec.suggestedGain > 0 ? '+' : ''}${rec.suggestedGain.toFixed(1)}</div>
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:${isUp ? 'flex-end' : 'flex-start'};height:70px;width:100%;position:relative;">
              <div style="position:absolute;top:50%;left:0;right:0;height:1px;background:#1e2330;"></div>
              <div style="width:100%;height:${h}px;background:${color};border-radius:3px;opacity:.85;${isUp ? 'margin-top:auto' : 'margin-bottom:auto'}"></div>
            </div>
            <div style="font-size:8px;color:#6e7782;font-family:monospace;text-align:center;line-height:1.3;">${rec.frequency >= 1000 ? (rec.frequency / 1000) + 'k' : rec.frequency} Hz</div>
          </div>`
        }).join('')}
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:12px;font-size:8px;color:#3d4451;font-family:monospace;">
        <span>-4 dB</span><span>0 dB</span><span>+4 dB</span>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <div style="border-top:1px solid #1e2330;padding-top:20px;display:flex;justify-content:space-between;align-items:center;">
    <div style="font-size:9.5px;color:#3d4451;font-family:'JetBrains Mono',monospace;">
      FreqLens · Ezel Alexander Duque Arias · TFG DAM 2026
    </div>
    <div style="font-size:9px;color:#3d4451;font-family:monospace;">
      Procesado íntegramente en el navegador · Sin backend · Web Audio API
    </div>
  </div>

</div>
</body>
</html>`
}

export function downloadReport(data: ReportData): void {
  const html = generateRoomReport(data)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const safeName = data.roomName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').toLowerCase()
  a.download = `FreqLens_Informe_${safeName}_${Date.now()}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}