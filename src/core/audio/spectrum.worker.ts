/**
 * SpectrumWorker - Renders the FFT data to an OffscreenCanvas
 * Frees the main thread from drawing thousands of bars/points.
 */

let canvas: OffscreenCanvas | null = null
let ctx: OffscreenCanvasRenderingContext2D | null = null

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data

  if (type === 'init') {
    canvas = payload.canvas
    ctx = canvas!.getContext('2d')
  }

  if (type === 'render' && ctx && canvas) {
    const { data, width, height, theme } = payload
    renderSpectrum(ctx, data, width, height, theme)
  }
}

function renderSpectrum(
  ctx: OffscreenCanvasRenderingContext2D, 
  data: Float32Array, 
  width: number, 
  height: number,
  theme: Record<string, string>
) {
  ctx.clearRect(0, 0, width, height)
  
  // Fondo de rejilla profesional (opcional)
  drawGrid(ctx, width, height)

  ctx.beginPath()
  ctx.strokeStyle = theme.primary || '#00ffcc'
  ctx.lineWidth = 2
  ctx.lineJoin = 'round'

  const minFreq = 20
  const maxFreq = 22050
  const logMin = Math.log10(minFreq)
  const logMax = Math.log10(maxFreq)
  const logRange = logMax - logMin

  for (let i = 0; i < data.length; i++) {
    // Frecuencia real de este bin
    const freq = (i * 22050) / data.length
    if (freq < minFreq) continue

    // Mapeo logarítmico a coordenada X
    const x = ((Math.log10(freq) - logMin) / logRange) * width
    
    // Magnitud (dB) a coordenada Y
    const v = (data[i] + 100) / 100 // Rango -100dB a 0dB
    const y = height - (Math.max(0, Math.min(1, v)) * height)
    
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  
  ctx.stroke()
}

function drawGrid(ctx: OffscreenCanvasRenderingContext2D, width: number, height: number) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
  ctx.lineWidth = 1
  
  // Frecuencias clave para la rejilla (log)
  const keyFreqs = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000]
  const logMin = Math.log10(20)
  const logMax = Math.log10(22050)
  
  keyFreqs.forEach(f => {
    const x = ((Math.log10(f) - logMin) / (logMax - logMin)) * width
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  })
}
