import { comparePrices } from '@/domain'
import type { CardLoad, PriceDelta, PriceRecord } from '@/domain/types'
import { getProductCard } from '@/data/off'
import { addView, latestPrice } from '@/data/prices'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useProductStore = defineStore('product', () => {
  const record = ref<PriceRecord | null>(null)
  const delta = ref<PriceDelta | null>(null)
  const cardLoad = ref<CardLoad | null>(null)

  async function openRecord(opened: PriceRecord): Promise<void> {
    record.value = opened
    delta.value = null
    cardLoad.value = null
    const previous = await latestPrice(opened.productKey, opened.per, {
      createdAt: opened.createdAt,
      id: opened.id,
    })
    delta.value = previous
      ? comparePrices(opened.unitPrice, previous.unitPrice, previous.createdAt)
      : null
    const load = await getProductCard(opened.barcode)
    cardLoad.value = load
    const ready = load.status === 'ready' ? load.card : null
    await addView({
      productKey: opened.productKey,
      barcode: opened.barcode,
      name: ready && ready.name ? ready.name : opened.name,
      brand: ready ? ready.brand : '',
      openedAt: Date.now(),
    })
  }

  return { record, delta, cardLoad, openRecord }
})
