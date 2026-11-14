import type { CardView, PerUnit, PriceRecord } from '@/domain/types'
import { db } from './db'

function byNewestPrice(a: PriceRecord, b: PriceRecord): number {
  if (a.createdAt !== b.createdAt) return b.createdAt - a.createdAt
  return (b.id ?? 0) - (a.id ?? 0)
}

function byNewestView(a: CardView, b: CardView): number {
  if (a.openedAt !== b.openedAt) return b.openedAt - a.openedAt
  return (b.id ?? 0) - (a.id ?? 0)
}

function isEarlier(
  row: PriceRecord,
  before: { createdAt: number; id?: number },
): boolean {
  if (row.createdAt > before.createdAt) return false
  if (row.createdAt < before.createdAt) return true
  if (before.id === undefined || row.id === undefined) return true
  return row.id < before.id
}

export async function addPrice(record: PriceRecord): Promise<PriceRecord> {
  const stored: Omit<PriceRecord, 'id'> = {
    productKey: record.productKey,
    name: record.name,
    barcode: record.barcode,
    packPrice: record.packPrice,
    quantity: record.quantity,
    quantityUnit: record.quantityUnit,
    priceMode: record.priceMode,
    unitPrice: record.unitPrice,
    per: record.per,
    source: record.source,
    createdAt: record.createdAt,
  }
  const id = await db.prices.add(stored)
  return { ...stored, id }
}

export async function latestPrice(
  productKey: string,
  per: PerUnit,
  before?: { createdAt: number; id?: number },
): Promise<PriceRecord | undefined> {
  const rows = await db.prices.where('productKey').equals(productKey).toArray()
  const eligible = rows.filter((row) => row.per === per && (before ? isEarlier(row, before) : true))
  eligible.sort(byNewestPrice)
  return eligible[0]
}

export async function latestAny(productKey: string): Promise<PriceRecord | undefined> {
  const rows = await db.prices.where('productKey').equals(productKey).toArray()
  rows.sort(byNewestPrice)
  return rows[0]
}

export async function listPrices(): Promise<PriceRecord[]> {
  const rows = await db.prices.toArray()
  rows.sort(byNewestPrice)
  return rows
}

export async function addView(view: CardView): Promise<void> {
  const stored: Omit<CardView, 'id'> = {
    productKey: view.productKey,
    barcode: view.barcode,
    name: view.name,
    brand: view.brand,
    openedAt: view.openedAt,
  }
  await db.views.add(stored)
}

export async function listViews(): Promise<CardView[]> {
  const rows = await db.views.toArray()
  rows.sort(byNewestView)
  return rows
}
