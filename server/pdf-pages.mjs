import { ApiError, requireCondition } from './errors.mjs';

// Load PDF rendering only when Gemini fails on a PDF. No OCR models are loaded.
export async function* renderPdfPages(bytes, { loadPdf = async () => (await import('pdf-to-img')).pdf } = {}) {
  let document;
  try {
    const pdf = await loadPdf();
    document = await pdf(`data:application/pdf;base64,${bytes.toString('base64')}`, { scale: 1.5 });
    requireCondition(document.length > 0 && document.length <= 12, 413,
      'Groq fallback supports PDFs up to 12 pages. Split this PDF into shorter documents.');
    for await (const page of document) yield page;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(422, 'Could not render this PDF for Groq. Upload an unlocked PDF or certificate image.');
  } finally {
    if (document) await document.destroy();
  }
}
