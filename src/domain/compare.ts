import type { PriceDelta } from './types'

export function comparePrices(current: number, previous: number, previousAt: number): PriceDelta | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return null
  if (Math.abs(current - previous) < 0.005) return null
  const diff = Math.round((current - previous) * 100) / 100
  const percent = Math.round(((current - previous) / previous) * 1000) / 10
  const direction = diff < 0 ? 'cheaper' : 'dearer'
  return { previous, previousAt, diff, percent, direction }
}
