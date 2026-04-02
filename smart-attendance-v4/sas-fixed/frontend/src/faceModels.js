import * as faceapi from 'face-api.js'

// Try loading from local /models first, fall back to jsDelivr CDN
const LOCAL = '/models'
const CDN   = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights'

let loaded = false

async function tryLoad(url) {
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(url),
    faceapi.nets.faceLandmark68Net.loadFromUri(url),
    faceapi.nets.faceRecognitionNet.loadFromUri(url),
  ])
}

export async function loadModels(onStatus) {
  if (loaded) return

  // First try local files
  try {
    onStatus?.('Loading models from local files...')
    await tryLoad(LOCAL)
    loaded = true
    onStatus?.('Models loaded ✓')
    return
  } catch (localErr) {
    console.warn('Local models failed, trying CDN...', localErr.message)
  }

  // Fall back to CDN
  try {
    onStatus?.('Local models missing/corrupt — loading from CDN (one-time, ~8 MB)...')
    await tryLoad(CDN)
    loaded = true
    onStatus?.('Models loaded from CDN ✓')
  } catch (cdnErr) {
    loaded = false
    throw new Error(
      'Could not load face-api models from local files or CDN. ' +
      'Check your internet connection and try again. Details: ' + cdnErr.message
    )
  }
}

export function resetModels() {
  loaded = false
}
