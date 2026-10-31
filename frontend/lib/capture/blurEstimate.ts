/**
 * Advisory blur estimation helper for client photo capture (Blueprint §6.5, I14).
 * Advisory only: the browser never decides a photo is "good enough".
 */

export interface BlurCheckResult {
  isBlurry: boolean;
  score: number;
}

export function estimateAdvisoryBlur(imageData: ImageData, threshold = 100): BlurCheckResult {
  const { data, width, height } = imageData;
  // Compute basic variance of grayscale luminance
  let sum = 0;
  let sumSq = 0;
  const totalPixels = width * height;

  for (let i = 0; i < data.length; i += 4) {
    // Standard perceptual luminance weights
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    sum += gray;
    sumSq += gray * gray;
  }

  const mean = sum / totalPixels;
  const variance = sumSq / totalPixels - mean * mean;
  const score = Math.round(variance);

  return {
    isBlurry: score < threshold,
    score,
  };
}
