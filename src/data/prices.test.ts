import 'fake-indexeddb/auto'

import type { PriceRecord } from '@/domain/types'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from './db'
import { addPrice, latestPrice, listPrices } from './prices'

function price(overrides: Partial<PriceRecord> = {}): PriceRecord {
  return {
    productKey: 'milk',
    name: 'Молоко',
    barcode: '4600605001014',
    packPrice: 89.9,
    quantity: 930,
    quantityUnit: 'ml',
    priceMode: 'package',
    unitPrice: 9.67,
    per: '100ml',
    source: 'manual',
    createdAt: 1_700_000_000_000,
    ...overrides,
  }
}

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('prices', () => {
  it('returns the older same-per row when before is the newer row', async () => {
    const older = await addPrice(price({ createdAt: 100, unitPrice: 9 }))
    const newer = await addPrice(price({ createdAt: 200, unitPrice: 12 }))

    expect(older.id).toEqual(expect.any(Number))
    expect(newer.id).toEqual(expect.any(Number))
    expect(newer.id).not.toBe(older.id)

    const previous = await latestPrice(newer.productKey, newer.per, {
      createdAt: newer.createdAt,
      id: newer.id,
    })
    expect(previous?.id).toBe(older.id)
    expect(previous?.unitPrice).toBe(9)
  })

  it('does not return a row with a different per', async () => {
    await addPrice(price({ createdAt: 100, per: '100ml', unitPrice: 9 }))
    const other = await addPrice(
      price({
        createdAt: 300,
        per: 'piece',
        priceMode: 'piece',
        quantityUnit: 'piece',
        unitPrice: 50,
      }),
    )

    const same = await latestPrice('milk', '100ml', {
      createdAt: other.createdAt,
      id: other.id,
    })
    expect(same?.per).toBe('100ml')
    expect(same?.unitPrice).toBe(9)

    expect(await latestPrice('milk', '100g')).toBeUndefined()
    expect(await latestPrice('milk', 'piece')).toMatchObject({ id: other.id, per: 'piece' })
  })

  it('excludes the same timestamp when id is greater or equal', async () => {
    const first = await addPrice(price({ createdAt: 50, unitPrice: 1 }))
    const second = await addPrice(price({ createdAt: 50, unitPrice: 2 }))

    const found = await latestPrice('milk', '100ml', {
      createdAt: second.createdAt,
      id: second.id,
    })
    expect(found?.id).toBe(first.id)
    expect(found?.unitPrice).toBe(1)
  })

  it('lists prices newest first', async () => {
    const older = await addPrice(price({ createdAt: 100, unitPrice: 9 }))
    const newer = await addPrice(price({ createdAt: 200, unitPrice: 12 }))
    const other = await addPrice(
      price({ productKey: 'bread', createdAt: 300, per: 'piece', unitPrice: 40 }),
    )

    const list = await listPrices()
    expect(list.map((row) => row.id)).toEqual([other.id, newer.id, older.id])
    expect(list.map((row) => row.createdAt)).toEqual([300, 200, 100])
  })
})
