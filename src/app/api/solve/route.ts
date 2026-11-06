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

    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const isVercel = host ? host.toLowerCase().includes('vercel.app') : Boolean(process.env.VERCEL || process.env.VERCEL_URL);
    const provider = getActiveMathProvider(host);

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

    // Standard JSON response with automatic fallback if primary provider fails
    let solution;
    let usedProviderName = provider.name;
    try {
      solution = await provider.solve({
        query: query || '',
        imageBase64,
        imageMimeType,
      });
    } catch (primaryErr: any) {
      if (isVercel) {
        // On the vercel domain, keep NVIDIA NIM as provider and surface actual error
        throw primaryErr;
      }
      console.warn('Primary provider failed, falling back to publik:', primaryErr.message || primaryErr);
      if (!provider.name.includes('publik')) {
        const { PublikProvider } = await import('@/core/providers/publik');
        const fallback = new PublikProvider();
        if (fallback.isAvailable()) {
          solution = await fallback.solve({
            query: query || '',
            imageBase64,
            imageMimeType,
          });
          usedProviderName = fallback.name;
        } else {
          throw primaryErr;
        }
      } else {
        throw primaryErr;
      }
    }

    return NextResponse.json({
      success: true,
      provider: usedProviderName,
      solution,
    });
  } catch (error: any) {
    console.error('API /api/solve error:', error);
    const topUpMatch = error.message?.match(/https?:\/\/[^\s]+/);
    const is402 = error.status === 402 || error.message?.includes('402') || error.message?.includes('balance exhausted');
    return NextResponse.json(
      {
        error: error.message || 'Internal solver error',
        topUpUrl: topUpMatch ? topUpMatch[0] : undefined,
      },
      { status: is402 ? 402 : 500 }
    );
  }
}
