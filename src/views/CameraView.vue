<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { grabFrame, openCamera, readBarcode, readText, stopCamera } from '@/capture'
import { parseLabel } from '@/domain'
import { useScanStore } from '@/stores/scan'

const router = useRouter()
const scan = useScanStore()
const videoRef = ref<HTMLVideoElement | null>(null)
const stream = ref<MediaStream | null>(null)
const cameraUnavailable = ref(false)
let left = false

onMounted(() => {
  const video = videoRef.value
  if (!video) {
    cameraUnavailable.value = true
    return
  }
  void openCamera(video)
    .then((opened) => {
      if (left) {
        stopCamera(opened)
        return
      }
      stream.value = opened
    })
    .catch(() => {
      if (!left) cameraUnavailable.value = true
    })
})

onUnmounted(() => {
  left = true
  stopCamera(stream.value)
})

function openHistory(): void {
  void router.push('/history')
}

function manual(): void {
  scan.beginManual()
  void router.push('/confirm')
}

async function shoot(): Promise<void> {
  const video = videoRef.value
  if (!video || stream.value === null || scan.busy) return
  scan.setBusy(true)
  scan.setError('')
  try {
    const canvas = grabFrame(video)
    const [code, text] = await Promise.all([readBarcode(canvas), readText(canvas)])
    const parsed = parseLabel(text)
    scan.beginFromCapture({
      ...parsed,
      barcode: code || parsed.barcode || '',
      source: 'camera',
    })
    await router.push('/confirm')
  } catch {
    scan.setError('Не удалось прочитать кадр. Можно ввести ценник вручную.')
  } finally {
    scan.setBusy(false)
  }
}
</script>

<template>
  <div class="shell camera">
    <video ref="videoRef" class="camera-video" autoplay muted playsinline />
    <div class="camera-ui">
      <div class="stage">
        <header class="camera-header">
          <span class="camera-brand">Цена</span>
          <button type="button" class="camera-history" @click="openHistory">История</button>
        </header>
        <div class="finder">
          <p class="finder-label">Ценник</p>
          <div class="frame" />
          <p v-if="cameraUnavailable" class="camera-alert">
            Камера недоступна. Можно ввести ценник вручную.
          </p>
          <p v-else-if="scan.error" class="camera-alert">{{ scan.error }}</p>
        </div>
      </div>
      <div class="sheet">
        <button
          type="button"
          class="shutter"
          aria-label="Снять ценник"
          :disabled="scan.busy"
          :aria-busy="scan.busy"
          @click="shoot"
        >
          <span class="shutter-disc" />
        </button>
        <p v-if="scan.busy" class="sheet-status" aria-live="polite">Читаем ценник</p>
        <button type="button" class="text-button" @click="manual">Ввести вручную</button>
      </div>
    </div>
  </div>
</template>
