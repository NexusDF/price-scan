<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Chevron from '@/components/Chevron.vue'
import { formatHistoryWhen, formatMoney, formatPer } from '@/domain'
import type { CardView, PriceRecord, Source } from '@/domain'
import { useHistoryStore } from '@/stores/history'
import { useProductStore } from '@/stores/product'

const router = useRouter()
const history = useHistoryStore()
const product = useProductStore()
const opening = ref(false)

onMounted(() => {
  void history.load().catch(() => {
    // Lists stay as they are.
  })
})

function selectTab(tab: 'scans' | 'cards'): void {
  history.tab = tab
}

function sourceWord(source: Source): string {
  if (source === 'manual') return 'вручную'
  return 'камера'
}

function back(): void {
  router.back()
}

async function openScan(row: PriceRecord): Promise<void> {
  if (opening.value) return
  opening.value = true
  try {
    await product.openRecord(row)
    await router.push('/product')
  } catch {
    // Stay on the list.
  } finally {
    opening.value = false
  }
}

async function openCard(row: CardView): Promise<void> {
  if (opening.value) return
  opening.value = true
  try {
    const price = await history.priceFor(row.productKey)
    if (!price) return
    await product.openRecord(price)
    await router.push('/product')
  } catch {
    // Stay on the list.
  } finally {
    opening.value = false
  }
}
</script>

<template>
  <main class="shell screen screen-history">
    <button type="button" class="icon-button" aria-label="Назад" @click="back">
      <Chevron direction="left" />
    </button>
    <h1 class="screen-title history-title">История</h1>

    <div class="segment" role="tablist">
      <button
        type="button"
        class="segment-button"
        role="tab"
        :aria-selected="history.tab === 'scans'"
        @click="selectTab('scans')"
      >
        Сканы
      </button>
      <button
        type="button"
        class="segment-button"
        role="tab"
        :aria-selected="history.tab === 'cards'"
        @click="selectTab('cards')"
      >
        Карточки
      </button>
    </div>

    <template v-if="history.tab === 'scans'">
      <div v-if="history.scans.length" class="list">
        <button
          v-for="row in history.scans"
          :key="row.id ?? `${row.productKey}-${row.createdAt}`"
          type="button"
          class="row"
          @click="openScan(row)"
        >
          <span class="row-body">
            <span class="row-name">{{ row.name }}</span>
            <span class="row-detail">
              <span class="mono">{{ formatMoney(row.unitPrice) }}</span>
              {{ formatPer(row.per) }}
            </span>
            <span class="row-meta">{{ formatHistoryWhen(row.createdAt) }} · {{ sourceWord(row.source) }}</span>
          </span>
          <Chevron class="row-chevron" direction="right" />
        </button>
      </div>
      <p v-else class="empty">Пока пусто</p>
    </template>

    <template v-else>
      <div v-if="history.cards.length" class="list">
        <button
          v-for="row in history.cards"
          :key="row.id ?? `${row.productKey}-${row.openedAt}`"
          type="button"
          class="row"
          @click="openCard(row)"
        >
          <span class="row-body">
            <span class="row-name">{{ row.name }}</span>
            <span class="row-detail">{{ row.brand || 'название с ценника' }}</span>
            <span class="row-meta">{{ formatHistoryWhen(row.openedAt) }}</span>
          </span>
          <Chevron class="row-chevron" direction="right" />
        </button>
      </div>
      <p v-else class="empty">Пока пусто</p>
    </template>
  </main>
</template>
