import { extractText, getDocumentProxy } from 'unpdf'

export const maxDuration = 30

const MAX_FILE_BYTES = 15 * 1024 * 1024 // 15MB
const MAX_TEXT_CHARS = 50000 // matches the cap used for video transcripts

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return Response.json({ error: 'No PDF file was received.' }, { status: 400 })
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return Response.json({ error: 'Please upload a PDF file.' }, { status: 400 })
    }

    if (file.size > MAX_FILE_BYTES) {
      return Response.json({ error: 'That PDF is too large — please upload something under 15MB.' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const pdf = await getDocumentProxy(new Uint8Array(buffer))
    const { text } = await extractText(pdf, { mergePages: true })

    const cleaned = text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()

    if (!cleaned || cleaned.length < 50) {
      return Response.json(
        { error: "Couldn't find readable text in that PDF — it may be a scanned image without a text layer. Try a different file, or paste the text directly." },
        { status: 400 },
      )
    }

    return Response.json({
      text: cleaned.length > MAX_TEXT_CHARS ? cleaned.slice(0, MAX_TEXT_CHARS) : cleaned,
      truncated: cleaned.length > MAX_TEXT_CHARS,
    })
  } catch (error) {
    console.error('PDF extraction error:', error)
    return Response.json(
      { error: "Couldn't read that PDF — it may be corrupted, password-protected, or in an unsupported format." },
      { status: 400 },
    )
  }
}
