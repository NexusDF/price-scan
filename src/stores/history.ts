import type { CardView, PriceRecord } from '@/domain/types'
import { latestAny, listPrices, listViews } from '@/data/prices'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useHistoryStore = defineStore('history', () => {
  const tab = ref<'scans' | 'cards'>('scans')
  const scans = ref<PriceRecord[]>([])
  const cards = ref<CardView[]>([])

  async function load(): Promise<void> {
    const [priceRows, viewRows] = await Promise.all([listPrices(), listViews()])
    scans.value = priceRows
    cards.value = viewRows
  }

  async function priceFor(productKey: string): Promise<PriceRecord | undefined> {
    return latestAny(productKey)
  }

  return { tab, scans, cards, load, priceFor }
})
