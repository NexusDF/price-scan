import { BrowserMultiFormatReader } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'

const hints = new Map<DecodeHintType, BarcodeFormat[]>([
  [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13]],
])

const reader = new BrowserMultiFormatReader(hints)

const EAN_13_TEXT = /^\d{13}$/

export function readBarcode(canvas: HTMLCanvasElement): string | null {
  try {
    const text = reader.decodeFromCanvas(canvas).getText()
    if (!EAN_13_TEXT.test(text)) {
      return null
    }
    return text
  } catch {
    return null
  }
}
