import { describe, expect, it } from 'vitest'
import {
  basisLabel,
  comparePrices,
  computeQuote,
  formatCompareWhen,
  formatDeltaLine,
  formatDeltaPill,
  formatHistoryWhen,
  formatMoney,
  formatPer,
  formatPercent,
  formatQuantity,
  isEan13,
  parseLabel,
  parsePriceInput,
  parseQuantityInput,
  productKey,
} from './index'
import type { PriceMode, QuantityUnit } from './types'

const nov2 = new Date(2026, 10, 2, 12).getTime()
const nov14 = new Date(2026, 10, 14, 15, 45).getTime()

describe('computeQuote', () => {
  it('prices a 900 g pack per 100 g', () => {
    expect(
      computeQuote({ price: 79.9, quantity: 900, quantityUnit: 'g', priceMode: 'package' }),
    ).toEqual({ value: 8.88, per: '100g' })
  })

  it('prices a per-kg tag per 100 g', () => {
    expect(
      computeQuote({ price: 129, quantity: null, quantityUnit: null, priceMode: 'perKg' }),
    ).toEqual({ value: 12.9, per: '100g' })
  })

  it('prices a 1.5 l pack per 100 ml', () => {
    expect(
      computeQuote({ price: 69, quantity: 1.5, quantityUnit: 'l', priceMode: 'package' }),
    ).toEqual({ value: 4.6, per: '100ml' })
  })

  it('prices an 800 g pack per 100 g', () => {
    expect(
      computeQuote({ price: 68.8, quantity: 800, quantityUnit: 'g', priceMode: 'package' }),
    ).toEqual({ value: 8.6, per: '100g' })
  })

  it('keeps a piece price', () => {
    expect(
      computeQuote({ price: 10.9, quantity: 1, quantityUnit: 'piece', priceMode: 'piece' }),
    ).toEqual({ value: 10.9, per: 'piece' })
  })

  it('prices a per-litre tag per 100 ml', () => {
    expect(
      computeQuote({ price: 120, quantity: null, quantityUnit: null, priceMode: 'perL' }),
    ).toEqual({ value: 12, per: '100ml' })
  })

  it('ignores pack size when the tag is per kg', () => {
    expect(
      computeQuote({ price: 129, quantity: 900, quantityUnit: 'g', priceMode: 'perKg' }),
    ).toEqual({ value: 12.9, per: '100g' })
  })

  it('converts kilograms and millilitres', () => {
    expect(
      computeQuote({ price: 100, quantity: 1, quantityUnit: 'kg', priceMode: 'package' }),
    ).toEqual({ value: 10, per: '100g' })
    expect(
      computeQuote({ price: 80, quantity: 800, quantityUnit: 'ml', priceMode: 'package' }),
    ).toEqual({ value: 10, per: '100ml' })
  })

  it('treats a package counted in pieces as a piece price', () => {
    expect(
      computeQuote({ price: 50, quantity: null, quantityUnit: 'piece', priceMode: 'package' }),
    ).toEqual({ value: 50, per: 'piece' })
  })

  it('returns null without a positive price or pack size', () => {
    const missing: { price: number | null; quantity: number | null; quantityUnit: QuantityUnit | null; priceMode: PriceMode }[] = [
      { price: null, quantity: 900, quantityUnit: 'g', priceMode: 'package' },
      { price: Number.NaN, quantity: 900, quantityUnit: 'g', priceMode: 'package' },
      { price: 0, quantity: 900, quantityUnit: 'g', priceMode: 'package' },
      { price: -1, quantity: 900, quantityUnit: 'g', priceMode: 'perKg' },
      { price: 10, quantity: null, quantityUnit: 'g', priceMode: 'package' },
      { price: 10, quantity: 0, quantityUnit: 'g', priceMode: 'package' },
      { price: 10, quantity: -5, quantityUnit: 'kg', priceMode: 'package' },
      { price: 10, quantity: 1, quantityUnit: null, priceMode: 'package' },
    ]
    for (const draft of missing) expect(computeQuote(draft)).toBeNull()
  })
})

describe('basisLabel', () => {
  it('names the printed basis', () => {
    expect(basisLabel('perKg')).toBe('за 1 кг')
    expect(basisLabel('perL')).toBe('за 1 л')
    expect(basisLabel('package')).toBe('за упаковку')
    expect(basisLabel('piece')).toBe('')
  })
})

describe('parsePriceInput', () => {
  it('reads ruble amounts', () => {
    expect(parsePriceInput('129,00 ₽')).toBe(129)
    expect(parsePriceInput('129.00')).toBe(129)
    expect(parsePriceInput('129')).toBe(129)
    expect(parsePriceInput('10,90 ₽')).toBe(10.9)
    expect(parsePriceInput('79,90\u00a0₽')).toBe(79.9)
  })

  it('rejects empty, garbage, and negative text', () => {
    expect(parsePriceInput('')).toBeNull()
    expect(parsePriceInput('   ')).toBeNull()
    expect(parsePriceInput('abc')).toBeNull()
    expect(parsePriceInput('-5')).toBeNull()
    expect(parsePriceInput('\u22125')).toBeNull()
    expect(parsePriceInput('3,2%')).toBeNull()
  })
})

describe('parseQuantityInput', () => {
  it('reads weight, volume, and pieces', () => {
    expect(parseQuantityInput('1 кг')).toEqual({ quantity: 1, quantityUnit: 'kg' })
    expect(parseQuantityInput('1кг')).toEqual({ quantity: 1, quantityUnit: 'kg' })
    expect(parseQuantityInput('900 г')).toEqual({ quantity: 900, quantityUnit: 'g' })
    expect(parseQuantityInput('900г')).toEqual({ quantity: 900, quantityUnit: 'g' })
    expect(parseQuantityInput('1,5 л')).toEqual({ quantity: 1.5, quantityUnit: 'l' })
    expect(parseQuantityInput('1.5 l')).toEqual({ quantity: 1.5, quantityUnit: 'l' })
    expect(parseQuantityInput('800 мл')).toEqual({ quantity: 800, quantityUnit: 'ml' })
    expect(parseQuantityInput('1 шт')).toEqual({ quantity: 1, quantityUnit: 'piece' })
    expect(parseQuantityInput('1 штука')).toEqual({ quantity: 1, quantityUnit: 'piece' })
    expect(parseQuantityInput('2 штуки')).toEqual({ quantity: 2, quantityUnit: 'piece' })
  })

  it('returns nulls for an empty field', () => {
    expect(parseQuantityInput('')).toEqual({ quantity: null, quantityUnit: null })
    expect(parseQuantityInput('   ')).toEqual({ quantity: null, quantityUnit: null })
  })
})

describe('isEan13', () => {
  it('checks length and the checksum', () => {
    expect(isEan13('4006381333931')).toBe(true)
    expect(isEan13('4006381333932')).toBe(false)
    expect(isEan13('4600605034123')).toBe(false)
    expect(isEan13('123456789012')).toBe(false)
    expect(isEan13('12345678901234')).toBe(false)
    expect(isEan13('400638133393X')).toBe(false)
    expect(isEan13('')).toBe(false)
  })
})

describe('productKey', () => {
  it('prefers a valid barcode and otherwise folds the name', () => {
    expect(productKey({ barcode: ' 4006381333931 ', name: 'Молоко' })).toBe('4006381333931')
    expect(productKey({ barcode: '4600605034123', name: '  Молоко   3,2% ' })).toBe('молоко 3,2%')
    expect(productKey({ barcode: '', name: 'Сыр   Российский' })).toBe('сыр российский')
    expect(productKey({ barcode: '', name: 'Молоко\n3,2%' })).toBe('молоко 3,2%')
    expect(productKey({ barcode: '  ', name: '  ' })).toBe('')
    expect(productKey({ barcode: '', name: '' })).toBe('')
  })
})

describe('comparePrices', () => {
  it('describes a cheaper price', () => {
    expect(comparePrices(12.9, 14.3, nov2)).toEqual({
      previous: 14.3,
      previousAt: nov2,
      diff: -1.4,
      percent: -9.8,
      direction: 'cheaper',
    })
  })

  it('describes a dearer price', () => {
    expect(comparePrices(12.9, 10.8, nov2)).toEqual({
      previous: 10.8,
      previousAt: nov2,
      diff: 2.1,
      percent: 19.4,
      direction: 'dearer',
    })
  })

  it('skips an unchanged, zero, or non-finite previous price', () => {
    expect(comparePrices(10, 10, nov2)).toBeNull()
    expect(comparePrices(10, 10.004, nov2)).toBeNull()
    expect(comparePrices(12.9, 0, nov2)).toBeNull()
    expect(comparePrices(12.9, Number.NaN, nov2)).toBeNull()
    expect(comparePrices(12.9, Number.POSITIVE_INFINITY, nov2)).toBeNull()
  })
})

describe('format', () => {
  it('formats money with a comma and a ruble sign', () => {
    expect(formatMoney(12.9)).toBe('12,90 ₽')
    expect(formatMoney(129)).toBe('129,00 ₽')
    expect(formatMoney(-1.4)).toBe('\u22121,40 ₽')
  })

  it('formats quantities', () => {
    expect(formatQuantity(1, 'kg')).toBe('1 кг')
    expect(formatQuantity(900, 'g')).toBe('900 г')
    expect(formatQuantity(1.5, 'l')).toBe('1,5 л')
    expect(formatQuantity(800, 'ml')).toBe('800 мл')
    expect(formatQuantity(1, 'piece')).toBe('1 шт')
  })

  it('formats the comparison unit', () => {
    expect(formatPer('100g')).toBe('за 100 г')
    expect(formatPer('100ml')).toBe('за 100 мл')
    expect(formatPer('piece')).toBe('за штуку')
  })

  it('formats compare dates in the local calendar', () => {
    const genitive = [
      'января',
      'февраля',
      'марта',
      'апреля',
      'мая',
      'июня',
      'июля',
      'августа',
      'сентября',
      'октября',
      'ноября',
      'декабря',
    ]
    for (let month = 0; month < 12; month += 1) {
      const ts = new Date(2026, month, 2, 12).getTime()
      const now = new Date(2026, month, 15, 12).getTime()
      expect(formatCompareWhen(ts, now)).toBe(`2 ${genitive[month]}`)
    }
    expect(formatCompareWhen(new Date(2024, 10, 2, 12).getTime(), nov14)).toBe('2 ноября 2024')
    expect(formatCompareWhen(nov14, nov14)).toBe('14 ноября')
  })

  it('formats history dates in the local calendar', () => {
    const short = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
    for (let month = 0; month < 12; month += 1) {
      const ts = new Date(2026, month, 2, 12).getTime()
      const now = new Date(2026, month, 15, 12).getTime()
      expect(formatHistoryWhen(ts, now)).toBe(`2 ${short[month]}`)
    }
    expect(formatHistoryWhen(new Date(2026, 10, 14, 1).getTime(), nov14)).toBe('Сегодня')
    expect(formatHistoryWhen(new Date(2026, 10, 13, 23, 59).getTime(), nov14)).toBe('Вчера')
    expect(formatHistoryWhen(new Date(2026, 10, 12, 12).getTime(), nov14)).toBe('12 ноя')
    expect(formatHistoryWhen(new Date(2024, 10, 12, 12).getTime(), nov14)).toBe('12 ноя 2024')
    const newYear = new Date(2026, 0, 1, 10).getTime()
    expect(formatHistoryWhen(new Date(2025, 11, 31, 22).getTime(), newYear)).toBe('Вчера')
  })

  it('formats percents with a unicode minus', () => {
    expect(formatPercent(-9.8)).toBe('\u22129,8%')
    expect(formatPercent(9.8)).toBe('9,8%')
    expect(formatPercent(-9.8).charCodeAt(0)).toBe(0x2212)
  })

  it('formats the delta pill and line', () => {
    const cheaper = comparePrices(12.9, 14.3, nov2)
    const dearer = comparePrices(12.9, 10.8, nov2)
    expect(cheaper).not.toBeNull()
    expect(dearer).not.toBeNull()
    if (!cheaper || !dearer) return
    expect(formatDeltaPill(cheaper)).toBe('Дешевле на 1,40 ₽')
    expect(formatDeltaPill(dearer)).toBe('Дороже на 2,10 ₽')
    expect(formatDeltaLine(cheaper, nov14)).toBe('было 14,30 ₽ \u00b7 2 ноября \u00b7 \u22129,8%')
  })
})

describe('parseLabel', () => {
  it('reads a pack price', () => {
    expect(parseLabel('Гречка ядрица\n900 г\n79,90 ₽')).toEqual({
      name: 'Гречка ядрица',
      price: 79.9,
      quantity: 900,
      quantityUnit: 'g',
      priceMode: 'package',
      barcode: '',
    })
  })

  it('reads a per-kg price and keeps fat percent out of the price', () => {
    expect(parseLabel('Молоко 3,2%\n129,00\nза 1 кг\n4600605034123')).toEqual({
      name: 'Молоко 3,2%',
      price: 129,
      priceMode: 'perKg',
      barcode: '4600605034123',
      quantity: 1,
      quantityUnit: 'kg',
    })
    expect(parseLabel('Молоко 3,2%').price).toBeUndefined()
  })

  it('reads a piece price', () => {
    expect(parseLabel('Яйца С1\n10,90 ₽\n1 шт')).toEqual({
      name: 'Яйца С1',
      price: 10.9,
      quantity: 1,
      quantityUnit: 'piece',
      priceMode: 'piece',
      barcode: '',
    })
  })

  it('keeps a volume that sits inside the name', () => {
    expect(parseLabel('Вода 1,5 л\n69,00 ₽')).toEqual({
      name: 'Вода 1,5 л',
      price: 69,
      quantity: 1.5,
      quantityUnit: 'l',
      priceMode: 'package',
      barcode: '',
    })
  })

  it('keeps the pack weight when the tag is also per kg', () => {
    expect(parseLabel('Сметана\n89,90 ₽\nза 1 кг\n350 г')).toEqual({
      name: 'Сметана',
      price: 89.9,
      priceMode: 'perKg',
      quantity: 350,
      quantityUnit: 'g',
      barcode: '',
    })
  })

  it('reads a per-litre price', () => {
    expect(parseLabel('Сок\n120,00\nза 1 л')).toEqual({
      name: 'Сок',
      price: 120,
      priceMode: 'perL',
      quantity: 1,
      quantityUnit: 'l',
      barcode: '',
    })
  })

  it('returns nothing for an empty label', () => {
    expect(parseLabel('')).toEqual({})
    expect(parseLabel('  \n  ')).toEqual({})
  })

  it('reads a price separated by a nbsp', () => {
    expect(parseLabel('79,90\u00a0₽')).toEqual({ price: 79.9, barcode: '' })
  })

  it('does not set source', () => {
    expect(parseLabel('Гречка ядрица\n900 г\n79,90 ₽')).not.toHaveProperty('source')
  })

  it('prefers a currency price and keeps an invalid barcode', () => {
    expect(parseLabel('100,00\n79,90 ₽').price).toBe(79.9)
    expect(parseLabel('10,50\n20,00').price).toBe(10.5)
    expect(parseLabel('Товар\n4006381333932\n10,00 ₽')).toMatchObject({
      name: 'Товар',
      barcode: '4006381333932',
      price: 10,
    })
    expect(isEan13('4006381333932')).toBe(false)
  })

  it('treats millilitres as a pack volume', () => {
    expect(parseLabel('Сок\n800 мл\n90,00 ₽')).toEqual({
      name: 'Сок',
      price: 90,
      quantity: 800,
      quantityUnit: 'ml',
      priceMode: 'package',
      barcode: '',
    })
  })

  it('reads per-kg and per-litre phrases', () => {
    expect(parseLabel('Молоко\n100,00 ₽/кг')).toEqual({
      name: 'Молоко',
      price: 100,
      priceMode: 'perKg',
      quantity: 1,
      quantityUnit: 'kg',
      barcode: '',
    })
    expect(parseLabel('Сок\n120,00 руб/л')).toEqual({
      name: 'Сок',
      price: 120,
      priceMode: 'perL',
      quantity: 1,
      quantityUnit: 'l',
      barcode: '',
    })
    expect(parseLabel('Сыр\nза кг\n800,00')).toMatchObject({
      priceMode: 'perKg',
      quantity: 1,
      quantityUnit: 'kg',
      price: 800,
    })
    expect(parseLabel('45 ₽/кг')).toEqual({
      price: 45,
      priceMode: 'perKg',
      quantity: 1,
      quantityUnit: 'kg',
      barcode: '',
    })
  })

  it('keeps a quantity written inside the product line', () => {
    expect(parseLabel('Гречка ядрица 900 г\n79,90 ₽')).toMatchObject({
      name: 'Гречка ядрица 900 г',
      quantity: 900,
      quantityUnit: 'g',
      priceMode: 'package',
    })
  })
})
