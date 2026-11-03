import { NextRequest, NextResponse } from 'next/server';
import { getActiveMathProvider } from '@/core/providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, imageBase64, imageMimeType, stream = false } = body;

    if (!query && !imageBase64) {
      return NextResponse.json(
        { error: 'Please provide a math question or image.' },
        { status: 400 }
      );
    }

    const provider = getActiveMathProvider();

    if (stream) {
      // SSE streaming response
      const textEncoder = new TextEncoder();
      const customReadable = new ReadableStream({
        async start(controller) {
          try {
            const tokenStream = provider.solveStream({
              query: query || '',
              imageBase64,
              imageMimeType,
            });

            for await (const token of tokenStream) {
              const data = `data: ${JSON.stringify({ text: token })}\n\n`;
              controller.enqueue(textEncoder.encode(data));
            }
            controller.enqueue(textEncoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (err: any) {
            controller.error(err);
          }
        },
      });

      return new Response(customReadable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    }

    // Standard JSON response
    const solution = await provider.solve({
      query: query || '',
      imageBase64,
      imageMimeType,
    });

    return NextResponse.json({
      success: true,
      provider: provider.name,
      solution,
    });
  } catch (error: any) {
    console.error('API /api/solve error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal solver error' },
      { status: 500 }
    );
  }
}
