import type { QuantityUnit } from './types'

/** мл|ml stand before л|l so «800 мл» is not read as litres. */
export const quantityUnitSource = 'кг|kg|мл|ml|гр|г|g|л|l|штуки|штука|штук|шт'

export function quantityUnitFromLabel(label: string): QuantityUnit | null {
  switch (label.toLowerCase()) {
    case 'кг':
    case 'kg':
      return 'kg'
    case 'мл':
    case 'ml':
      return 'ml'
    case 'л':
    case 'l':
      return 'l'
    case 'гр':
    case 'г':
    case 'g':
      return 'g'
    case 'шт':
    case 'штука':
    case 'штук':
    case 'штуки':
      return 'piece'
    default:
      return null
  }
}

export function parsePriceInput(text: string): number | null {
  const cleaned = text
    .replace(/₽/g, '')
    .replace(/руб(?:лей|\.)?/gi, '')
    .replace(/\s+/g, '')
  if (cleaned === '' || !/^\d+(?:[.,]\d+)?$/.test(cleaned)) return null
  const value = Number(cleaned.replace(',', '.'))
  if (!Number.isFinite(value) || value < 0) return null
  return value
}

export function parseQuantityInput(text: string): {
  quantity: number | null
  quantityUnit: QuantityUnit | null
} {
  const match = text
    .trim()
    .match(new RegExp(`^(\\d+(?:[.,]\\d+)?)\\s*(${quantityUnitSource})$`, 'iu'))
  const raw = match?.[1]
  const label = match?.[2]
  if (raw === undefined || label === undefined) return { quantity: null, quantityUnit: null }
  const quantity = Number(raw.replace(',', '.'))
  const quantityUnit = quantityUnitFromLabel(label)
  if (!Number.isFinite(quantity) || quantityUnit == null) return { quantity: null, quantityUnit: null }
  return { quantity, quantityUnit }
}
