export function isEan13(code: string): boolean {
  if (!/^\d{13}$/.test(code)) return false
  let sum = 0
  for (let i = 0; i < 12; i += 1) {
    const digit = code.charCodeAt(i) - 48
    sum += digit * (i % 2 === 0 ? 1 : 3)
  }
  const check = (10 - (sum % 10)) % 10
  return check === code.charCodeAt(12) - 48
}

export function productKey(input: { barcode: string; name: string }): string {
  const barcode = input.barcode.trim()
  if (isEan13(barcode)) return barcode
  return input.name.trim().toLowerCase().replace(/\s+/g, ' ')
}
