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
  
  // Professional grid background
  drawGrid(ctx, width, height)

  const accentColor = theme.primary || '#ff8c00'

  ctx.beginPath()
  ctx.strokeStyle = accentColor
  ctx.lineWidth = 1.75
  ctx.lineJoin = 'round'

  const minFreq = 20
  const maxFreq = 22050
  const logMin = Math.log10(minFreq)
  const logMax = Math.log10(maxFreq)
  const logRange = logMax - logMin

  let firstPoint = true
  for (let i = 0; i < data.length; i++) {
    // Real frequency of this bin
    const freq = (i * 22050) / data.length
    if (freq < minFreq) continue

    // Logarithmic mapping to X coordinate
    const x = ((Math.log10(freq) - logMin) / logRange) * width
    
    // Magnitude (dB) to Y coordinate
    const v = (data[i] + 100) / 100 // Range -100dB to 0dB
    const y = height - (Math.max(0, Math.min(1, v)) * height)
    
    if (firstPoint) {
      ctx.moveTo(x, y)
      firstPoint = false
    } else {
      ctx.lineTo(x, y)
    }
  }
  ctx.stroke()

  // Filled area under the curve
  if (!firstPoint && data.length > 0) {
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    const fillGrad = ctx.createLinearGradient(0, 0, 0, height)
    fillGrad.addColorStop(0, 'rgba(255, 140, 0, 0.08)')
    fillGrad.addColorStop(1, 'rgba(255, 140, 0, 0.0)')
    ctx.fillStyle = fillGrad
    ctx.fill()
  }
}

function drawGrid(ctx: OffscreenCanvasRenderingContext2D, width: number, height: number) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)'
  ctx.lineWidth = 1
  
  // Key frequencies for log grid
  const keyFreqs = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000]
  const logMin = Math.log10(20)
  const logMax = Math.log10(22050)
  
  keyFreqs.forEach(f => {
    const x = ((Math.log10(f) - logMin) / (logMax - logMin)) * width
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()

    // Add minimal grid text labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
    ctx.font = '8px "JetBrains Mono", monospace'
    const label = f >= 1000 ? `${f/1000}k` : `${f}`
    ctx.fillText(label, x + 4, height - 8)
  })
}
