/** Shared contract. Do not change these types without updating every caller. */

export type Source = 'camera' | 'manual'

export type QuantityUnit = 'g' | 'kg' | 'ml' | 'l' | 'piece'

/** How the printed price is denominated. */
export type PriceMode = 'perKg' | 'perL' | 'package' | 'piece'

export type PerUnit = '100g' | '100ml' | 'piece'

export type Draft = {
  source: Source
  name: string
  barcode: string
  /** Printed price in rubles. */
  price: number | null
  quantity: number | null
  quantityUnit: QuantityUnit | null
  priceMode: PriceMode
}

export type PriceQuote = {
  /** Rubles per 100 g, per 100 ml, or per piece. Two decimal places. */
  value: number
  per: PerUnit
}

export type PriceRecord = {
  id?: number
  productKey: string
  name: string
  barcode: string
  packPrice: number
  quantity: number
  quantityUnit: QuantityUnit
  priceMode: PriceMode
  unitPrice: number
  per: PerUnit
  source: Source
  createdAt: number
}

export type CardView = {
  id?: number
  productKey: string
  barcode: string
  name: string
  brand: string
  openedAt: number
}

export type OffCard = {
  barcode: string
  found: boolean
  name: string
  brand: string
  imageUrl: string
  quantity: string
  ingredients: string
  nutriscore: '' | 'a' | 'b' | 'c' | 'd' | 'e'
  fetchedAt: number
}

export type PriceDelta = {
  previous: number
  previousAt: number
  /** current - previous. Negative means cheaper. */
  diff: number
  /** Percent vs previous, one decimal. Negative means cheaper. */
  percent: number
  direction: 'cheaper' | 'dearer'
}

export type CardLoad =
  | { status: 'ready'; card: OffCard }
  | { status: 'missing'; card: OffCard | null }
  | { status: 'offline-missing' }
