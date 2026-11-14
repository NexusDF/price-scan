import type { PerUnit, PriceDelta, QuantityUnit } from './types'

const GENITIVE_MONTHS = [
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
] as const

const SHORT_MONTHS = [
  'янв',
  'фев',
  'мар',
  'апр',
  'мая',
  'июн',
  'июл',
  'авг',
  'сен',
  'окт',
  'ноя',
  'дек',
] as const

const UNIT_LABEL: Record<QuantityUnit, string> = {
  g: 'г',
  kg: 'кг',
  ml: 'мл',
  l: 'л',
  piece: 'шт',
}

function formatAmount(amount: number): string {
  const negative = amount < 0
  const abs = Math.abs(amount)
  const text = Number.isInteger(abs)
    ? String(abs)
    : abs.toFixed(10).replace(/0+$/, '').replace(/\.$/, '').replace('.', ',')
  return negative ? `\u2212${text}` : text
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function formatMoney(value: number): string {
  const negative = value < 0
  const cents = Math.round(Math.abs(value) * 100)
  const rubles = Math.floor(cents / 100)
  const fraction = String(cents % 100).padStart(2, '0')
  const sign = negative && cents !== 0 ? '\u2212' : ''
  return `${sign}${rubles},${fraction} ₽`
}

export function formatQuantity(amount: number, unit: QuantityUnit): string {
  return `${formatAmount(amount)} ${UNIT_LABEL[unit]}`
}

export function formatPer(per: PerUnit): string {
  switch (per) {
    case '100g':
      return 'за 100 г'
    case '100ml':
      return 'за 100 мл'
    case 'piece':
      return 'за штуку'
  }
}

export function formatCompareWhen(ts: number, now = Date.now()): string {
  const date = new Date(ts)
  const today = new Date(now)
  const month = GENITIVE_MONTHS[date.getMonth()] ?? ''
  const label = `${date.getDate()} ${month}`
  return date.getFullYear() === today.getFullYear() ? label : `${label} ${date.getFullYear()}`
}

export function formatHistoryWhen(ts: number, now = Date.now()): string {
  const date = new Date(ts)
  const today = new Date(now)
  if (sameDay(date, today)) return 'Сегодня'
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (sameDay(date, yesterday)) return 'Вчера'
  const month = SHORT_MONTHS[date.getMonth()] ?? ''
  const label = `${date.getDate()} ${month}`
  return date.getFullYear() === today.getFullYear() ? label : `${label} ${date.getFullYear()}`
}

export function formatPercent(value: number): string {
  const negative = value < 0
  const tenths = Math.round(Math.abs(value) * 10)
  if (tenths === 0) return '0,0%'
  const whole = Math.floor(tenths / 10)
  const fraction = tenths % 10
  return `${negative ? '\u2212' : ''}${whole},${fraction}%`
}

export function formatDeltaPill(delta: PriceDelta): string {
  const amount = formatMoney(Math.abs(delta.diff))
  switch (delta.direction) {
    case 'cheaper':
      return `Дешевле на ${amount}`
    case 'dearer':
      return `Дороже на ${amount}`
  }
}

export function formatDeltaLine(delta: PriceDelta, now = Date.now()): string {
  return `было ${formatMoney(delta.previous)} \u00b7 ${formatCompareWhen(delta.previousAt, now)} \u00b7 ${formatPercent(delta.percent)}`
}
