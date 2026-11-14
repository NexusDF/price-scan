<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import { useRouter } from 'vue-router'
import Chevron from '@/components/Chevron.vue'
import {
  basisLabel,
  formatMoney,
  formatPer,
  formatQuantity,
  parsePriceInput,
  parseQuantityInput,
} from '@/domain'
import type { Draft } from '@/domain'
import { useProductStore } from '@/stores/product'
import { useScanStore } from '@/stores/scan'

const router = useRouter()
const scan = useScanStore()
const product = useProductStore()

const priceText = ref('')
const quantityText = ref('')
const nameText = ref('')
const barcodeText = ref('')
const saving = ref(false)

const basis = computed(() => {
  const draft = scan.draft
  if (!draft || !scan.quote) return ''
  return basisLabel(draft.priceMode)
})

function fillFields(): void {
  const draft = scan.draft
  if (!draft) return
  priceText.value = draft.price == null ? '' : formatMoney(draft.price)
  quantityText.value =
    draft.quantity != null && draft.quantityUnit
      ? formatQuantity(draft.quantity, draft.quantityUnit)
      : ''
  nameText.value = draft.name
  barcodeText.value = draft.barcode
}

fillFields()

onBeforeMount(() => {
  if (!scan.draft) void router.replace('/')
})

function inputValue(event: Event): string {
  const target = event.target
  if (!(target instanceof HTMLInputElement)) return ''
  return target.value
}

function onPrice(event: Event): void {
  const raw = inputValue(event)
  priceText.value = raw
  scan.patchDraft({ price: parsePriceInput(raw) })
}

function onPriceBlur(): void {
  const price = scan.draft?.price
  if (price == null) return
  priceText.value = formatMoney(price)
}

function onQuantity(event: Event): void {
  const raw = inputValue(event)
  quantityText.value = raw
  const draft = scan.draft
  if (!draft) return
  const parsed = parseQuantityInput(raw)
  const patch: Partial<Draft> = {
    quantity: parsed.quantity,
    quantityUnit: parsed.quantityUnit,
  }
  const unit = parsed.quantityUnit
  if (unit === 'piece') {
    patch.priceMode = 'piece'
  } else if (
    draft.priceMode === 'piece' &&
    (unit === 'g' || unit === 'kg' || unit === 'ml' || unit === 'l')
  ) {
    patch.priceMode = 'package'
  }
  scan.patchDraft(patch)
}

function onQuantityBlur(): void {
  const draft = scan.draft
  if (!draft || draft.quantity == null || draft.quantityUnit == null) return
  quantityText.value = formatQuantity(draft.quantity, draft.quantityUnit)
}

function onName(event: Event): void {
  const value = inputValue(event)
  nameText.value = value
  scan.patchDraft({ name: value })
}

function onBarcode(event: Event): void {
  const value = inputValue(event)
  barcodeText.value = value
  scan.patchDraft({ barcode: value })
}

function back(): void {
  void router.push('/')
}

async function save(): Promise<void> {
  if (!scan.quote || saving.value) return
  saving.value = true
  scan.setError('')
  try {
    const record = await scan.save()
    await product.openRecord(record)
    await router.replace('/product')
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : ''
    if (message) scan.setError(message)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <main v-if="scan.draft" class="shell screen">
    <header class="nav">
      <button type="button" class="icon-button" aria-label="Назад" @click="back">
        <Chevron direction="left" />
      </button>
      <h1 class="nav-title">Проверка</h1>
    </header>

    <p class="hero">{{ scan.quote ? formatMoney(scan.quote.value) : '— ₽' }}</p>

    <div v-if="scan.quote" class="basis-row">
      <span class="per">{{ formatPer(scan.quote.per) }}</span>
      <span v-if="basis" class="pill">{{ basis }}</span>
    </div>

    <p v-if="scan.quote?.per === 'piece'" class="piece-note">
      Веса на ценнике нет. Цену за 100 г не считаем.
    </p>

    <div class="group group-fields">
      <label class="field">
        <span class="field-label">Цена</span>
        <input
          class="field-value mono"
          type="text"
          inputmode="decimal"
          autocomplete="off"
          spellcheck="false"
          :value="priceText"
          @input="onPrice"
          @blur="onPriceBlur"
        />
      </label>
      <label class="field">
        <span class="field-label">Количество</span>
        <input
          class="field-value"
          type="text"
          inputmode="decimal"
          autocomplete="off"
          spellcheck="false"
          :value="quantityText"
          @input="onQuantity"
          @blur="onQuantityBlur"
        />
      </label>
      <label class="field">
        <span class="field-label">Название</span>
        <input
          class="field-value"
          type="text"
          autocomplete="off"
          :value="nameText"
          @input="onName"
        />
      </label>
      <label class="field">
        <span class="field-label">Штрихкод</span>
        <input
          class="field-value mono"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          spellcheck="false"
          :value="barcodeText"
          @input="onBarcode"
        />
      </label>
    </div>

    <p v-if="scan.quote?.per !== 'piece'" class="caption">
      Поправьте поля, если кадр прочитан неверно.
    </p>
    <p v-if="scan.error" class="caption">{{ scan.error }}</p>

    <button
      type="button"
      class="primary"
      :disabled="!scan.quote || saving"
      @click="save"
    >
      {{ scan.quote ? 'Сохранить цену' : 'Посчитать цену' }}
    </button>
    <button type="button" class="text-button" @click="back">Снять ещё раз</button>
  </main>
  <main v-else class="shell screen" />
</template>
