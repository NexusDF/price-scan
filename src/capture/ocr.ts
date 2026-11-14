import Tesseract from 'tesseract.js'

let workerPromise: Promise<Tesseract.Worker> | null = null

function getWorker(): Promise<Tesseract.Worker> {
  if (workerPromise !== null) {
    return workerPromise
  }

  const created = Tesseract.createWorker('rus+eng').then(async (worker) => {
    await worker.setParameters({ preserve_interword_spaces: '1' })
    return worker
  })

  workerPromise = created
  created.catch(() => {
    if (workerPromise === created) {
      workerPromise = null
    }
  })
  return created
}

export async function readText(canvas: HTMLCanvasElement): Promise<string> {
  try {
    const worker = await getWorker()
    const { data } = await worker.recognize(canvas)
    return data.text.trimEnd()
  } catch {
    return ''
  }
}
