export async function openCamera(video: HTMLVideoElement): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: 'environment' } },
    audio: false,
  })
  video.srcObject = stream
  video.playsInline = true
  video.muted = true
  await video.play()
  return stream
}

export function stopCamera(stream: MediaStream | null): void {
  if (stream === null) {
    return
  }
  for (const track of stream.getTracks()) {
    track.stop()
  }
}

export function grabFrame(video: HTMLVideoElement): HTMLCanvasElement {
  const width = video.videoWidth > 0 ? video.videoWidth : video.clientWidth
  const height = video.videoHeight > 0 ? video.videoHeight : video.clientHeight
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (context === null) {
    throw new Error('2D canvas context is unavailable')
  }
  context.drawImage(video, 0, 0, width, height)
  return canvas
}
