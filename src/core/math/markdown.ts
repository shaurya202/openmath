import { Marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import { normalizeLatexDelimiters, balanceUnclosedDelimiters } from './latex';

/**
 * Configure marked instance with KaTeX math rendering, GitHub-flavored markdown,
 * and safe HTML/link handling.
 */
const markedInstance = new Marked();

markedInstance.use(
  markedKatex({
    throwOnError: false,
    nonStandard: true,
  }),
  {
    gfm: true,
    breaks: true,
    renderer: {
      html({ text }: { text: string }) {
        return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      },
      link({ href, title, text }: { href: string; title?: string | null; text: string }) {
        const isUnsafe = /^javascript:/i.test(href.trim());
        const safeHref = isUnsafe ? '#' : href;
        const titleAttr = title ? ` title="${title}"` : '';
        return `<a href="${safeHref}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
      },
    },
  }
);

/**
 * Escapes potentially dangerous raw HTML tags prior to markdown parsing.
 */
function sanitizeDangerousHtml(input: string): string {
  return input.replace(
    /<(\/?(?:script|iframe|object|embed|form|input|button|style|link|meta|base)\b[^>]*)>/gi,
    '&lt;$1&gt;'
  );
}

/**
 * Parses markdown with embedded LaTeX ($...$, $$...$$, \(...\), \[...\]) into sanitized HTML.
 */
export function renderMarkdownToHtml(markdown: string): string {
  if (!markdown) return '';

  // 1. Balance unclosed delimiters (crucial for streaming tokens)
  const balanced = balanceUnclosedDelimiters(markdown);

  // 2. Normalize \( \) and \[ \] delimiters to $ and $$
  const normalized = normalizeLatexDelimiters(balanced);

  // 3. Pre-sanitize hazardous HTML tags
  const sanitized = sanitizeDangerousHtml(normalized);

  // 4. Parse markdown and render LaTeX via marked + markedKatex
  return markedInstance.parse(sanitized) as string;
}
