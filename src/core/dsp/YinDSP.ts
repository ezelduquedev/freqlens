/**
 * YinDSP - High-precision Pitch Detection Logic
 * Based on: De Cheveigné, A., & Kawahara, H. (2002). 
 * YIN, a fundamental frequency estimator for speech and music.
 */

export class YinDSP {
  /**
   * Step 2: Difference Function
   * d_t(tau) = sum_{j=1}^{W} (x_j - x_{j+tau})^2
   */
  public static difference(buffer: Float32Array, tau: number, windowSize: number): number {
    let diff = 0
    for (let j = 0; j < windowSize; j++) {
      const tmp = buffer[j] - buffer[j + tau]
      diff += tmp * tmp
    }
    return diff
  }

  /**
   * Step 3: Cumulative Mean Normalized Difference Function
   */
  public static cumulativeMeanNormalizedDifference(diffs: Float32Array): Float32Array {
    const cmndf = new Float32Array(diffs.length)
    cmndf[0] = 1
    let sum = 0
    for (let tau = 1; tau < diffs.length; tau++) {
      sum += diffs[tau]
      cmndf[tau] = diffs[tau] / ((1 / tau) * sum)
    }
    return cmndf
  }

  /**
   * Step 4: Absolute Threshold
   * Finding the first local minimum below the threshold
   */
  public static absoluteThreshold(cmndf: Float32Array, threshold: number): number {
    for (let tau = 2; tau < cmndf.length; tau++) {
      if (cmndf[tau] < threshold) {
        // Find the first local minimum
        while (tau + 1 < cmndf.length && cmndf[tau + 1] < cmndf[tau]) {
          tau++
        }
        return tau
      }
    }
    return -1 // No pitch detected
  }

  /**
   * Step 5: Parabolic Interpolation
   * Improves precision beyond the sampling period limit
   */
  public static parabolicInterpolation(cmndf: Float32Array, tau: number): number {
    if (tau < 1 || tau >= cmndf.length - 1) return tau
    
    const alpha = cmndf[tau - 1]
    const beta = cmndf[tau]
    const gamma = cmndf[tau + 1]
    
    const betterTau = tau + (gamma - alpha) / (2 * (2 * beta - gamma - alpha))
    return betterTau
  }
}
