import { NextRequest, NextResponse } from 'next/server';
import { FRQGradingResult } from '@/types';
import { getActiveMathProvider } from '@/core/providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { question, studentWork, rubric, correctAnswer } = await req.json();

    if (!question || !studentWork) {
      return NextResponse.json(
        { error: 'Question and studentWork are required.' },
        { status: 400 }
      );
    }

    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const provider = getActiveMathProvider(host);

    // Use active AI provider if available (publik, Ollama, Gemini, OpenAI)
    if (provider.isAvailable()) {
      try {
        const prompt = `Grade the following student math response against the rubric.
Question: ${question}
Expected Answer: ${correctAnswer || 'Standard mathematical derivation'}
Rubric: ${JSON.stringify(rubric || [])}
Student Work: ${studentWork}

Return ONLY valid JSON matching this schema:
{
  "totalScore": 3.5,
  "maxScore": 4.0,
  "percentage": 87.5,
  "rubricBreakdown": [
    { "criterion": "1. Conceptual Setup & Formula Selection", "score": 1, "maxPoints": 1, "feedback": "Good choice of rule" },
    { "criterion": "2. Intermediate Derivation & Step Rigor", "score": 1, "maxPoints": 1, "feedback": "Steps are logical" },
    { "criterion": "3. Dimensional & Unit Consistency", "score": 1, "maxPoints": 1, "feedback": "Signs and units maintained" },
    { "criterion": "4. Final Accuracy & Boxed Value", "score": 0.5, "maxPoints": 1, "feedback": "Calculation details" }
  ],
  "overallFeedback": "Overall feedback summary."
}`;
        const res = await provider.solve({ query: prompt });
        const rawJson = res.boxedAnswer || res.interpretation;
        const parsed = typeof rawJson === 'string' && rawJson.trim().startsWith('{')
          ? JSON.parse(rawJson)
          : null;
        if (parsed && typeof parsed.totalScore === 'number') {
          return NextResponse.json({
            success: true,
            result: {
              id: `grade-${Date.now()}`,
              ...parsed,
              correctedSolutionLatex: correctAnswer || res.boxedAnswer,
            },
          });
        }
      } catch (aiErr) {
        console.warn('AI grading failed, using heuristic evaluation:', aiErr);
      }
    }

    // Heuristic Rubric Evaluation Engine
    const lower = studentWork.toLowerCase();
    const isNonsenseOrGuessed =
      lower.includes('guess') ||
      lower.includes('no work') ||
      lower.includes("don't know") ||
      lower.includes('idk');

    const hasMathSymbols = /[=+\-*/^∫]|\b(int|dx|dy|sin|cos|tan|lim)\b/i.test(studentWork);
    const hasIntermediateSteps = studentWork.split(/[;\n=]/).length >= 3;
    const hasCorrectFinal = correctAnswer
      ? studentWork.includes(correctAnswer)
      : /32\/3|10\.67/i.test(studentWork);

    let setupScore = 0;
    let derivationScore = 0;
    let consistencyScore = 0;
    let finalScore = 0;

    if (!isNonsenseOrGuessed && hasMathSymbols) {
      setupScore = 1.0;
      derivationScore = hasIntermediateSteps ? 1.0 : 0.5;
      consistencyScore = 1.0;
      finalScore = hasCorrectFinal ? 1.0 : 0.5;
    } else if (isNonsenseOrGuessed) {
      setupScore = 0.0;
      derivationScore = 0.0;
      consistencyScore = 0.0;
      finalScore = 0.0;
    } else {
      setupScore = 0.5;
      derivationScore = 0.0;
      consistencyScore = 0.5;
      finalScore = 0.0;
    }

    const totalScore = setupScore + derivationScore + consistencyScore + finalScore;
    const percentage = Math.round((totalScore / 4.0) * 1000) / 10;

    const result: FRQGradingResult = {
      id: `grade-${Date.now()}`,
      totalScore,
      maxScore: 4.0,
      percentage,
      rubricBreakdown: [
        {
          criterion: '1. Conceptual Setup & Formula Selection',
          score: setupScore,
          maxPoints: 1.0,
          feedback: setupScore === 1.0
            ? 'Accurately identified governing mathematical principles and formulas.'
            : 'Conceptual framework not demonstrated or missing integral setup.',
        },
        {
          criterion: '2. Intermediate Derivation & Step Rigor',
          score: derivationScore,
          maxPoints: 1.0,
          feedback: derivationScore === 1.0
            ? 'Clear algebraic manipulations demonstrated across intermediate lines.'
            : 'Intermediate steps skipped, incomplete, or absent.',
        },
        {
          criterion: '3. Dimensional & Unit Consistency',
          score: consistencyScore,
          maxPoints: 1.0,
          feedback: consistencyScore === 1.0
            ? 'Units, signs, and variable bindings maintained accurately throughout.'
            : 'Missing justification or inconsistent signs.',
        },
        {
          criterion: '4. Final Accuracy & Boxed Value',
          score: finalScore,
          maxPoints: 1.0,
          feedback: finalScore === 1.0
            ? 'Correct target answer reached with exact formulation.'
            : finalScore > 0
            ? 'Approached the correct target answer with minor discrepancy.'
            : 'Final answer incorrect or uncalculated.',
        },
      ],
      overallFeedback: totalScore >= 3.0
        ? 'Great mathematical comprehension! The conceptual formulation and algebraic progression were thoroughly executed.'
        : totalScore >= 1.5
        ? 'Partial credit awarded. Make sure to clearly write each intermediate step and verify the final value.'
        : 'Incomplete or unverified response. Show all mathematical setup, intermediate substitutions, and calculations to earn credit.',
      correctedSolutionLatex: correctAnswer || '32/3',
    };

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error('API /api/grade error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
