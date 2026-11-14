import type { Draft, PriceMode, PriceQuote, QuantityUnit } from './types'

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function packageQuote(
  price: number,
  quantity: number | null,
  quantityUnit: QuantityUnit | null,
): PriceQuote | null {
  if (quantityUnit === 'piece') return { value: round2(price), per: 'piece' }
  if (quantityUnit == null || quantity == null || !Number.isFinite(quantity) || quantity <= 0) {
    return null
  }
  if (quantityUnit === 'g' || quantityUnit === 'kg') {
    const grams = quantityUnit === 'kg' ? quantity * 1000 : quantity
    return { value: round2((price * 100) / grams), per: '100g' }
  }
  const millilitres = quantityUnit === 'l' ? quantity * 1000 : quantity
  return { value: round2((price * 100) / millilitres), per: '100ml' }
}

/** «за 1 кг» / «за 1 л» is ten times the price of 100 g / 100 ml. */
export function computeQuote(
  draft: Pick<Draft, 'price' | 'quantity' | 'quantityUnit' | 'priceMode'>,
): PriceQuote | null {
  const { price, quantity, quantityUnit, priceMode } = draft
  if (price == null || !Number.isFinite(price) || price <= 0) return null

  switch (priceMode) {
    case 'perKg':
      return { value: round2(price / 10), per: '100g' }
    case 'perL':
      return { value: round2(price / 10), per: '100ml' }
    case 'piece':
      return { value: round2(price), per: 'piece' }
    case 'package':
      return packageQuote(price, quantity, quantityUnit)
  }
}

export function basisLabel(mode: PriceMode): string {
  switch (mode) {
    case 'perKg':
      return 'за 1 кг'
    case 'perL':
      return 'за 1 л'
    case 'package':
      return 'за упаковку'
    case 'piece':
      return ''
  }
}
