/* yin-processor.js */
class YinProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 2048;
    this.buffer = new Float32Array(2048);
    this.pos = 0;
    this.threshold = 0.15;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0][0];
    if (!input) return true;

    for (let i = 0; i < input.length; i++) {
      this.buffer[this.pos] = input[i];
      this.pos++;

      if (this.pos >= this.bufferSize) {
        const pitch = this.detectPitch(this.buffer);
        if (pitch > 0) {
          this.port.postMessage({ type: 'PITCH_DETECTED', pitch: pitch });
        }
        this.pos = 0;
      }
    }
    return true;
  }

  detectPitch(buffer) {
    const tauMax = Math.floor(buffer.length / 2);
    const diffs = new Float32Array(tauMax);
    
    for (let tau = 0; tau < tauMax; tau++) {
      for (let j = 0; j < tauMax; j++) {
        const tmp = buffer[j] - buffer[j + tau];
        diffs[tau] += tmp * tmp;
      }
    }

    const cmndf = new Float32Array(tauMax);
    cmndf[0] = 1;
    let runningSum = 0;
    for (let tau = 1; tau < tauMax; tau++) {
      runningSum += diffs[tau];
      cmndf[tau] = diffs[tau] / ((1 / tau) * runningSum);
    }

    let tau = -1;
    for (let t = 2; t < tauMax; t++) {
      if (cmndf[t] < this.threshold) {
        while (t + 1 < tauMax && cmndf[t + 1] < cmndf[t]) {
          t++;
        }
        tau = t;
        break;
      }
    }

    if (tau === -1) return -1;

    const alpha = cmndf[tau - 1];
    const beta = cmndf[tau];
    const gamma = cmndf[tau + 1];
    const betterTau = tau + (gamma - alpha) / (2 * (2 * beta - gamma - alpha));

    return sampleRate / betterTau;
  }
}

registerProcessor('yin-processor', YinProcessor);