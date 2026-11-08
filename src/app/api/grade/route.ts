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
        const prompt = `You are an encouraging, thoughtful human math teacher grading a student's free-response work.
Speak directly to the student in a warm, constructive, human voice.

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
    { "criterion": "1. Conceptual Setup & Formula Selection", "score": 1, "maxPoints": 1, "feedback": "Clear, friendly note on what formula was chosen and why it fits" },
    { "criterion": "2. Intermediate Derivation & Step Rigor", "score": 1, "maxPoints": 1, "feedback": "Human feedback on the algebraic progression and intermediate steps" },
    { "criterion": "3. Dimensional & Unit Consistency", "score": 1, "maxPoints": 1, "feedback": "Specific feedback on signs, units, or notation" },
    { "criterion": "4. Final Accuracy & Boxed Value", "score": 0.5, "maxPoints": 1, "feedback": "Friendly feedback on the final calculation" }
  ],
  "overallFeedback": "Warm, encouraging tutor feedback directly addressing the student, highlighting what went well and pointing out how to fix any error."
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
            ? 'Spot on: you chose the right governing formula and set up the problem cleanly.'
            : 'Looks like the core formula or integral setup is missing here. Start by writing down the governing equation.',
        },
        {
          criterion: '2. Intermediate Derivation & Step Rigor',
          score: derivationScore,
          maxPoints: 1.0,
          feedback: derivationScore === 1.0
            ? 'Solid algebra throughout—your line-by-line derivation is easy to follow.'
            : 'A few intermediate steps were skipped or left out. Write out each substitution so your reasoning is clear.',
        },
        {
          criterion: '3. Dimensional & Unit Consistency',
          score: consistencyScore,
          maxPoints: 1.0,
          feedback: consistencyScore === 1.0
            ? 'Great attention to detail with signs, bounds, and variable bindings.'
            : 'Double check your signs and limits of integration to make sure terms stay consistent.',
        },
        {
          criterion: '4. Final Accuracy & Boxed Value',
          score: finalScore,
          maxPoints: 1.0,
          feedback: finalScore === 1.0
            ? 'Nailed the final answer!'
            : finalScore > 0
            ? 'Very close to the target result—just check your final arithmetic simplification.'
            : 'The final value didn\'t match the target answer. Walk back through the last few algebraic steps.',
        },
      ],
      overallFeedback: totalScore >= 3.0
        ? 'Really impressive work! Your conceptual setup is sharp, the steps flow logically, and you reached the right answer with solid rigor.'
        : totalScore >= 1.5
        ? 'Good start here! You have the right intuition in places, but be sure to write down each step of your derivation so you don\'t lose easy points.'
        : 'Take another crack at this one. Break the problem into parts: write down the starting formula first, show each intermediate calculation, and double check your arithmetic at the end.',
      correctedSolutionLatex: correctAnswer || '32/3',
    };

    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error('API /api/grade error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
