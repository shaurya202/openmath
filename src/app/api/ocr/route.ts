import { NextRequest, NextResponse } from 'next/server';
import { getActiveMathProvider } from '@/core/providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, imageMimeType = 'image/jpeg' } = await req.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'imageBase64 is required for OCR.' },
        { status: 400 }
      );
    }

    // Guard size (max ~5MB base64)
    if (imageBase64.length > 7 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image file too large. Please upload an image under 5MB.' },
        { status: 413 }
      );
    }

    const provider = getActiveMathProvider();

    if (!provider.isAvailable()) {
      return NextResponse.json(
        { error: 'No active AI provider available. Please connect publik API or configure an API key.' },
        { status: 503 }
      );
    }

    try {
      const solution = await provider.solve({
        query: 'Transcribe this math problem into exact LaTeX. Do not solve yet, just transcribe.',
        imageBase64,
        imageMimeType,
      });

      return NextResponse.json({
        success: true,
        transcription: solution.interpretation || 'Transcribed Math Problem',
        latex: solution.boxedAnswer || '',
      });
    } catch (e: any) {
      console.error('Multimodal OCR transcription failed:', e);
      return NextResponse.json(
        { error: e.message || 'Failed to transcribe math image with AI provider.' },
        { status: 502 }
      );
    }
  } catch (err: any) {
    console.error('API /api/ocr error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
