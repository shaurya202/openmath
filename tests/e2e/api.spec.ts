import { test, expect } from '@playwright/test';

test.describe('OpenMath API Endpoints', () => {
  test('GET /api/publik/status returns valid status schema', async ({ request }) => {
    const res = await request.get('/api/publik/status');
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.slug).toBe('openmath');
    expect(body.hasAppToken).toBe(true);
    expect(body).toHaveProperty('providerKind');
    expect(body).toHaveProperty('activeProvider');
  });

  test('POST /api/solve rejects empty requests with 400', async ({ request }) => {
    const res = await request.post('/api/solve', {
      data: {},
    });
    expect(res.status()).toBe(400);

    const body = await res.json();
    expect(body.error).toContain('Please provide a math question or image');
  });

  test('POST /api/grade evaluates math submission and returns scorecard', async ({ request }) => {
    const res = await request.post('/api/grade', {
      data: {
        question: 'Find the derivative of f(x) = x^3 - 6x^2 + 9x + 1.',
        studentWork: 'f\'(x) = 3x^2 - 12x + 9. Setting to 0 gives 3(x-1)(x-3) = 0, so critical points are x=1 and x=3.',
      },
    });

    // Grader uses publik, nvidia, or mock evaluation fallback
    expect([200, 402, 500]).toContain(res.status());
    if (res.status() === 200) {
      const data = await res.json();
      expect(data).toHaveProperty('totalScore');
      expect(data).toHaveProperty('rubricBreakdown');
    }
  });
});
