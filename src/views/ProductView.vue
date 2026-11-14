<script setup lang="ts">
import { computed, onBeforeMount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Chevron from '@/components/Chevron.vue'
import NutriBadge from '@/components/NutriBadge.vue'
import { formatDeltaLine, formatDeltaPill, formatMoney, formatPer, formatQuantity } from '@/domain'
import { useProductStore } from '@/stores/product'

const router = useRouter()
const product = useProductStore()
const photoFailed = ref(false)

const record = computed(() => product.record)

const readyCard = computed(() => {
  const load = product.cardLoad
  if (load?.status === 'ready') return load.card
  return null
})

const showMissing = computed(() => {
  const status = product.cardLoad?.status
  return status === 'missing' || status === 'offline-missing'
})

const showOffline = computed(() => product.cardLoad?.status === 'offline-missing')

const heading = computed(() => {
  const current = record.value
  if (!current) return ''
  const card = readyCard.value
  if (card?.name) return card.name
  return current.name
})

const subtitle = computed(() => {
  const load = product.cardLoad
  if (!load) return ''
  if (load.status === 'missing' || load.status === 'offline-missing') return 'название с ценника'
  if (load.status === 'ready') return load.card.brand
  return ''
})

const grade = computed(() => {
  const value = readyCard.value?.nutriscore
  if (value === 'a' || value === 'b' || value === 'c' || value === 'd' || value === 'e') return value
  return null
})

const showPhoto = computed(() => Boolean(readyCard.value?.imageUrl) && !photoFailed.value)

watch(
  () => readyCard.value?.imageUrl ?? '',
  () => {
    photoFailed.value = false
  },
)

onBeforeMount(() => {
  if (!product.record) void router.replace('/')
})

function failPhoto(): void {
  photoFailed.value = true
}

function back(): void {
  router.back()
}
</script>

<template>
  <main v-if="record" class="shell screen">
    <button type="button" class="icon-button" aria-label="Назад" @click="back">
      <Chevron direction="left" />
    </button>
    <h1 class="screen-title">{{ heading }}</h1>
    <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>

    <p class="price-line">
      <span class="hero">{{ formatMoney(record.unitPrice) }}</span>
      <span class="per">{{ formatPer(record.per) }}</span>
    </p>

    <div v-if="product.delta" class="delta">
      <span class="pill" :class="{ 'pill-dearer': product.delta.direction === 'dearer' }">
        {{ formatDeltaPill(product.delta) }}
      </span>
      <p class="caption">{{ formatDeltaLine(product.delta) }}</p>
    </div>

    <template v-if="readyCard">
      <h2 class="section-label">Карточка</h2>
      <article class="group group-card">
        <div v-if="showPhoto || grade" class="card-top" :class="{ 'card-top-solo': !showPhoto }">
          <img
            v-if="showPhoto"
            class="photo"
            :src="readyCard.imageUrl"
            :alt="heading"
            decoding="async"
            @error="failPhoto"
          />
          <div v-if="grade" class="nutri-slot">
            <NutriBadge :grade="grade" />
          </div>
        </div>
        <p v-if="readyCard.ingredients" class="ingredients">{{ readyCard.ingredients }}</p>
        <div class="card-meta" :class="{ 'card-meta-rule': showPhoto || grade || readyCard.ingredients }">
          <p class="pack-line">
            <span class="mono">{{ formatMoney(record.packPrice) }}</span>
            · {{ formatQuantity(record.quantity, record.quantityUnit) }}
          </p>
          <p class="barcode">{{ record.barcode }}</p>
        </div>
      </article>
    </template>

    <div v-else-if="showMissing" class="stack">
      <div class="group note">
        <p>В Open Food Facts этой позиции нет.</p>
        <p>Остаётся то, что подтвердили с ценника.</p>
        <p v-if="showOffline">Состав откроется с сетью.</p>
      </div>
      <div class="group group-fields">
        <div class="field">
          <span class="field-label">Упаковка</span>
          <span class="field-value mono">{{ formatMoney(record.packPrice) }}</span>
        </div>
        <div class="field">
          <span class="field-label">Количество</span>
          <span class="field-value">{{ formatQuantity(record.quantity, record.quantityUnit) }}</span>
        </div>
        <div class="field">
          <span class="field-label">Штрихкод</span>
          <span class="field-value mono">{{ record.barcode }}</span>
        </div>
      </div>
    </div>
  </main>
  <main v-else class="shell screen" />
</template>
