import Dexie, { type EntityTable } from 'dexie'
import type { CardView, OffCard, PriceRecord } from '@/domain/types'

class PriceScanDB extends Dexie {
  prices!: EntityTable<PriceRecord, 'id'>
  views!: EntityTable<CardView, 'id'>
  cards!: EntityTable<OffCard, 'barcode'>

  constructor() {
    super('price-scan')
    this.version(1).stores({
      prices: '++id, productKey, createdAt',
      views: '++id, productKey, openedAt',
      cards: 'barcode',
    })
  }
}

export const db = new PriceScanDB()
