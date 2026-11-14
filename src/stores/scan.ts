import { computeQuote, productKey } from '@/domain'
import type { Draft, PriceRecord, QuantityUnit } from '@/domain/types'
import { addPrice } from '@/data/prices'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

function emptyDraft(source: Draft['source']): Draft {
  return {
    source,
    name: '',
    barcode: '',
    price: null,
    quantity: null,
    quantityUnit: null,
    priceMode: 'package',
  }
}

function quantityForSave(draft: Draft): { quantity: number; quantityUnit: QuantityUnit } {
  let quantity = draft.quantity
  let quantityUnit = draft.quantityUnit
  if (quantity === null && draft.priceMode === 'perKg') {
    quantity = 1
    quantityUnit = 'kg'
  } else if (quantity === null && draft.priceMode === 'perL') {
    quantity = 1
    quantityUnit = 'l'
  } else if (quantity === null && draft.priceMode === 'piece') {
    quantity = 1
    quantityUnit = 'piece'
  }
  if (quantity === null || quantityUnit === null) throw new Error('Не указано количество')
  return { quantity, quantityUnit }
}

export const useScanStore = defineStore('scan', () => {
  const draft = ref<Draft | null>(null)
  const busy = ref(false)
  const error = ref('')
  const quote = computed(() => (draft.value === null ? null : computeQuote(draft.value)))

  function beginManual(): void {
    draft.value = emptyDraft('manual')
    error.value = ''
  }

  function beginFromCapture(partial: Partial<Draft>): void {
    const next = emptyDraft(partial.source ?? 'camera')
    Object.assign(next, partial)
    next.source = partial.source ?? 'camera'
    next.priceMode = partial.priceMode ?? 'package'
    draft.value = next
    error.value = ''
  }

  function patchDraft(patch: Partial<Draft>): void {
    if (draft.value === null) return
    Object.assign(draft.value, patch)
  }

  function reset(): void {
    draft.value = null
    error.value = ''
  }

  function setBusy(value: boolean): void {
    busy.value = value
  }

  function setError(message: string): void {
    error.value = message
  }

  async function save(): Promise<PriceRecord> {
    const current = draft.value
    const priced = current === null ? null : computeQuote(current)
    if (current === null || priced === null || current.price === null) {
      throw new Error('Нечего сохранять')
    }
    const { quantity, quantityUnit } = quantityForSave(current)
    const name = current.name.trim() || 'Без названия'
    const barcode = current.barcode.trim()
    return addPrice({
      productKey: productKey({ barcode, name }),
      name,
      barcode,
      packPrice: current.price,
      quantity,
      quantityUnit,
      priceMode: current.priceMode,
      unitPrice: priced.value,
      per: priced.per,
      source: current.source,
      createdAt: Date.now(),
    })
  }

  return {
    draft,
    busy,
    error,
    quote,
    beginManual,
    beginFromCapture,
    patchDraft,
    reset,
    setBusy,
    setError,
    save,
  }
})
