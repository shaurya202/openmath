/**
 * LaTeX normalization, balancing, and parsing utilities for OpenMath.
 */

export interface ParsedMathSegment {
  type: 'text' | 'inline-math' | 'display-math';
  content: string;
}

/**
 * Standardizes common alternative math delimiters like \( ... \) and \[ ... \]
 * to standard single-dollar ($...$) and double-dollar ($$...$$).
 */
export function normalizeLatexDelimiters(input: string): string {
  if (!input) return '';

  let normalized = input;
  // Replace \[ ... \] with $$ ... $$
  normalized = normalized.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');
  // Replace \( ... \) with $ ... $
  normalized = normalized.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');

  return normalized;
}

/**
 * Balances unclosed LaTeX delimiters for streaming responses.
 * When an LLM streams tokens, it often outputs an opening `$` or `$$`
 * before the closing token arrives. This function detects odd counts
 * and safely closes them for real-time KaTeX rendering.
 */
export function balanceUnclosedDelimiters(input: string): string {
  if (!input) return '';

  let text = input;

  // Check double dollars count ($$)
  const doubleCount = (text.match(/\$\$/g) || []).length;
  if (doubleCount % 2 !== 0) {
    text = text + '$$';
  } else {
    // Check single dollars (that are not part of $$)
    // Temporarily mask $$ to check single $
    const masked = text.replace(/\$\$[\s\S]*?\$\$/g, '');
    const singleMatches = masked.match(/(?<!\$)\$(?!\$)/g) || [];
    if (singleMatches.length % 2 !== 0) {
      text = text + '$';
    }
  }

  return text;
}

/**
 * Parses mixed markdown and LaTeX text into a structured sequence of
 * text, inline-math, and display-math segments for safe KaTeX rendering.
 */
export function parseMathSegments(text: string): ParsedMathSegment[] {
  if (!text) return [];

  const normalized = normalizeLatexDelimiters(text);
  const segments: ParsedMathSegment[] = [];

  // Match $$...$$ (display math) or $...$ (inline math)
  // Regex matches:
  // group 1: display math content inside $$...$$
  // group 2: inline math content inside $...$
  const regex = /\$\$([\s\S]*?)\$\$|\$([^$\n]+?)\$/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(normalized)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: normalized.slice(lastIndex, match.index),
      });
    }

    if (match[1] !== undefined) {
      // Display math $$...$$
      segments.push({
        type: 'display-math',
        content: match[1].trim(),
      });
    } else if (match[2] !== undefined) {
      // Inline math $...$
      segments.push({
        type: 'inline-math',
        content: match[2].trim(),
      });
    }

    lastIndex = regex.lastIndex;
  }

  // Any remaining text after last math match
  if (lastIndex < normalized.length) {
    segments.push({
      type: 'text',
      content: normalized.slice(lastIndex),
    });
  }

  return segments;
}

/**
 * Extracts all math functions suitable for graphing from a solution or text.
 * e.g., "y = x^2 - 4x + 3" -> "x^2 - 4*x + 3"
 */
export function extractGraphableFunctions(text: string): string[] {
  if (!text) return [];
  const functions: Set<string> = new Set();

  const patterns = [
    /(?:f\(x\)|y)\s*=\s*([^,;\n$]+)/gi,
    /\\boxed\{([^}]+)\}/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      let expr = match[1].trim();
      // Clean up common LaTeX commands into algebraic expressions
      expr = expr
        .replace(/\\cdot/g, '*')
        .replace(/\\times/g, '*')
        .replace(/\\sin/g, 'sin')
        .replace(/\\cos/g, 'cos')
        .replace(/\\tan/g, 'tan')
        .replace(/\\ln/g, 'log')
        .replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)')
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
        .replace(/\{|\}/g, '')
        .trim();

      if (expr && expr.includes('x') && expr.length < 50) {
        functions.add(expr);
      }
    }
  }

  return Array.from(functions);
}
