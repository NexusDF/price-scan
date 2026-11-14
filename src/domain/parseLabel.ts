import type { Draft, PriceMode, QuantityUnit } from './types'
import { quantityUnitFromLabel, quantityUnitSource } from './quantity'

type Span = { start: number; end: number }

type QuantityHit = Span & { quantity: number; quantityUnit: QuantityUnit }

type PriceHit = Span & { value: number; hasCurrency: boolean }

const MODE_PATTERNS: { mode: 'perKg' | 'perL'; source: string }[] = [
  { mode: 'perKg', source: String.raw`(?<![\p{L}])цена\s+за\s*(?:1\s*)?кг(?![\p{L}])` },
  { mode: 'perKg', source: String.raw`(?<![\p{L}])руб(?:лей|\.)?\s*/\s*кг(?![\p{L}])` },
  { mode: 'perKg', source: String.raw`₽\s*/\s*кг(?![\p{L}])` },
  { mode: 'perKg', source: String.raw`(?<![\p{L}])за\s*1\s*кг(?![\p{L}])` },
  { mode: 'perKg', source: String.raw`(?<![\p{L}])за\s+кг(?![\p{L}])` },
  { mode: 'perL', source: String.raw`(?<![\p{L}])цена\s+за\s*(?:1\s*)?л(?![\p{L}])` },
  { mode: 'perL', source: String.raw`(?<![\p{L}])руб(?:лей|\.)?\s*/\s*л(?![\p{L}])` },
  { mode: 'perL', source: String.raw`₽\s*/\s*л(?![\p{L}])` },
  { mode: 'perL', source: String.raw`(?<![\p{L}])за\s*1\s*л(?![\p{L}])` },
  { mode: 'perL', source: String.raw`(?<![\p{L}])за\s+л(?![\p{L}])` },
]

function overlapsAny(span: Span, others: readonly Span[]): boolean {
  return others.some((other) => span.start < other.end && other.start < span.end)
}

function mergeSpans(spans: readonly Span[]): Span[] {
  const sorted = [...spans].sort((a, b) => a.start - b.start || a.end - b.end)
  const merged: Span[] = []
  for (const span of sorted) {
    const last = merged.at(-1)
    if (last === undefined || span.start > last.end) merged.push({ start: span.start, end: span.end })
    else if (span.end > last.end) last.end = span.end
  }
  return merged
}

function stripSpans(text: string, spans: readonly Span[]): string {
  let out = ''
  let cursor = 0
  for (const span of mergeSpans(spans)) {
    out += text.slice(cursor, span.start)
    cursor = span.end
  }
  return out + text.slice(cursor)
}

function findModes(text: string): { mode: 'perKg' | 'perL' | null; spans: Span[] } {
  const spans: Span[] = []
  let mode: 'perKg' | 'perL' | null = null
  let modeAt = Number.POSITIVE_INFINITY
  for (const pattern of MODE_PATTERNS) {
    const re = new RegExp(pattern.source, 'giu')
    for (const match of text.matchAll(re)) {
      const start = match.index ?? 0
      spans.push({ start, end: start + match[0].length })
      if (start < modeAt) {
        modeAt = start
        mode = pattern.mode
      }
    }
  }
  return { mode, spans }
}

function findQuantities(text: string): QuantityHit[] {
  const hits: QuantityHit[] = []
  const re = new RegExp(String.raw`(?<!\d)(\d+(?:[.,]\d+)?)\s*(${quantityUnitSource})(?![\p{L}])`, 'giu')
  for (const match of text.matchAll(re)) {
    const raw = match[1]
    const label = match[2]
    if (raw === undefined || label === undefined) continue
    const quantity = Number(raw.replace(',', '.'))
    const quantityUnit = quantityUnitFromLabel(label)
    if (!Number.isFinite(quantity) || quantity <= 0 || quantityUnit == null) continue
    const start = match.index ?? 0
    hits.push({ quantity, quantityUnit, start, end: start + match[0].length })
  }
  return hits
}

function findPrices(text: string): PriceHit[] {
  const hits: PriceHit[] = []
  const re = /(?<!\d)(\d+)(?:([.,])(\d+))?/g
  for (const match of text.matchAll(re)) {
    const intPart = match[1]
    const frac = match[3]
    if (intPart === undefined) continue
    const start = match.index ?? 0
    const prev = text[start - 1]
    if (prev === '-' || prev === '\u2212') continue
    if (frac !== undefined && frac.length !== 2) continue
    const numberEnd = start + match[0].length
    const rest = text.slice(numberEnd)
    if (/^\s*%/.test(rest)) continue
    const currency = (frac === undefined ? /^\s*₽/u : /^\s*(?:₽|руб(?:лей|\.)?)/iu).exec(rest)
    if (frac === undefined && currency === null) continue
    const value = frac === undefined ? Number(intPart) : Number(`${intPart}.${frac}`)
    if (!Number.isFinite(value)) continue
    hits.push({
      value,
      hasCurrency: currency !== null,
      start,
      end: numberEnd + (currency?.[0].length ?? 0),
    })
  }
  return hits
}

function findBarcodeSpans(text: string): Span[] {
  const spans: Span[] = []
  for (const match of text.matchAll(/(?<!\d)\d{13}(?!\d)/g)) {
    const start = match.index ?? 0
    spans.push({ start, end: start + match[0].length })
  }
  return spans
}

function lineHasName(line: string): boolean {
  const { spans: modeSpans } = findModes(line)
  const quantities = findQuantities(line).filter((hit) => !overlapsAny(hit, modeSpans))
  const prices = findPrices(line).filter((hit) => !overlapsAny(hit, quantities))
  const rest = stripSpans(line, [...modeSpans, ...quantities, ...prices, ...findBarcodeSpans(line)])
  return /[\p{L}\p{N}]/u.test(rest)
}

export function parseLabel(text: string): Partial<Draft> {
  const source = text.replace(/\u00a0/g, ' ').replace(/\r\n?/g, '\n')
  if (source.trim() === '') return {}

  // «1 кг» inside «за 1 кг» is the basis. A separate «350 г» is the pack.
  const { mode, spans: modeSpans } = findModes(source)
  const quantities = findQuantities(source).filter((hit) => !overlapsAny(hit, modeSpans))
  const prices = findPrices(source).filter((hit) => !overlapsAny(hit, quantities))
  const priceHit = prices.find((hit) => hit.hasCurrency) ?? prices[0]
  const barcodeSpan = findBarcodeSpans(source)[0]
  const pack = quantities.find((hit) => hit.quantityUnit !== 'piece')
  const piece = quantities.find((hit) => hit.quantityUnit === 'piece')

  const draft: Partial<Draft> = {}
  const name = source
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0 && lineHasName(line))
    .join(' ')
  if (name) draft.name = name
  if (priceHit) draft.price = priceHit.value
  if (barcodeSpan) draft.barcode = source.slice(barcodeSpan.start, barcodeSpan.end)

  const priceMode: PriceMode | null = mode
  if (priceMode === 'perKg' || priceMode === 'perL') {
    draft.priceMode = priceMode
    if (pack) {
      draft.quantity = pack.quantity
      draft.quantityUnit = pack.quantityUnit
    } else if (priceMode === 'perKg') {
      draft.quantity = 1
      draft.quantityUnit = 'kg'
    } else {
      draft.quantity = 1
      draft.quantityUnit = 'l'
    }
  } else if (piece && !pack) {
    draft.priceMode = 'piece'
    draft.quantity = piece.quantity
    draft.quantityUnit = 'piece'
  } else if (pack) {
    draft.quantity = pack.quantity
    draft.quantityUnit = pack.quantityUnit
    if (priceHit) draft.priceMode = 'package'
  }

  if (Object.keys(draft).length === 0) return {}
  if (draft.barcode === undefined) draft.barcode = ''
  return draft
}
