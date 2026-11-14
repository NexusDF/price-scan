import { isEan13 } from '@/domain'
import type { CardLoad, OffCard } from '@/domain/types'
import { db } from './db'

const OFF_USER_AGENT = 'PriceScan/0.1 (PWA shelf-price scanner)'

type OffProductJson = {
  product_name_ru?: unknown
  product_name?: unknown
  brands?: unknown
  image_front_url?: unknown
  image_url?: unknown
  quantity?: unknown
  ingredients_text_ru?: unknown
  ingredients_text?: unknown
  nutriscore_grade?: unknown
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function firstBrand(brands: unknown): string {
  if (typeof brands !== 'string') return ''
  return (brands.split(',')[0] ?? '').trim()
}

function nutriscore(grade: unknown): OffCard['nutriscore'] {
  if (typeof grade !== 'string') return ''
  const lower = grade.toLowerCase()
  if (lower === 'a' || lower === 'b' || lower === 'c' || lower === 'd' || lower === 'e') return lower
  return ''
}

function readOff(value: unknown): { status: number; product: OffProductJson | null } {
  if (typeof value !== 'object' || value === null) return { status: 0, product: null }
  const body = value as { status?: unknown; product?: unknown }
  const status = typeof body.status === 'number' ? body.status : 0
  if (typeof body.product !== 'object' || body.product === null || Array.isArray(body.product)) {
    return { status, product: null }
  }
  return { status, product: body.product as OffProductJson }
}

function missingCard(barcode: string): OffCard {
  return {
    barcode,
    found: false,
    name: '',
    brand: '',
    imageUrl: '',
    quantity: '',
    ingredients: '',
    nutriscore: '',
    fetchedAt: Date.now(),
  }
}

function cardFromProduct(barcode: string, product: OffProductJson): OffCard {
  return {
    barcode,
    found: true,
    name: text(product.product_name_ru) || text(product.product_name),
    brand: firstBrand(product.brands),
    imageUrl: text(product.image_front_url) || text(product.image_url),
    quantity: text(product.quantity),
    ingredients: text(product.ingredients_text_ru) || text(product.ingredients_text),
    nutriscore: nutriscore(product.nutriscore_grade),
    fetchedAt: Date.now(),
  }
}

export async function getProductCard(barcode: string): Promise<CardLoad> {
  if (!isEan13(barcode)) return { status: 'missing', card: null }

  const cached = await db.cards.get(barcode)
  if (cached) return { status: cached.found ? 'ready' : 'missing', card: cached }

  let payload: unknown
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}`, {
      headers: { 'User-Agent': OFF_USER_AGENT },
    })
    if (response.status === 404) {
      const card = missingCard(barcode)
      await db.cards.put(card)
      return { status: 'missing', card }
    }
    if (!response.ok) return { status: 'offline-missing' }
    payload = await response.json()
  } catch {
    return { status: 'offline-missing' }
  }

  const body = readOff(payload)
  const card =
    body.status === 1 && body.product ? cardFromProduct(barcode, body.product) : missingCard(barcode)
  await db.cards.put(card)
  return card.found ? { status: 'ready', card } : { status: 'missing', card }
}
