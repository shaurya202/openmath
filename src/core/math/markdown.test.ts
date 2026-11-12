import { describe, it, expect } from 'vitest';
import { renderMarkdownToHtml } from './markdown';

describe('Markdown & Math Parser', () => {
  it('returns empty string for empty input', () => {
    expect(renderMarkdownToHtml('')).toBe('');
    expect(renderMarkdownToHtml(undefined as unknown as string)).toBe('');
  });

  it('renders standard markdown elements: headers, lists, bold, italics, and code', () => {
    const input = [
      '### Step 1: Differentiate',
      'Here is **bold** and *italic* text.',
      '- Item 1\n- Item 2',
      '1. First item\n2. Second item',
      '`inline code`',
      '```python\ndef solve(): pass\n```',
    ].join('\n\n');

    const html = renderMarkdownToHtml(input);
    expect(html).toContain('<h3>Step 1: Differentiate</h3>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>Item 1</li>');
    expect(html).toContain('<ol>');
    expect(html).toContain('<li>First item</li>');
    expect(html).toContain('<code>inline code</code>');
    expect(html).toContain('<pre><code class="language-python">');
  });

  it('renders inline and display LaTeX math with KaTeX', () => {
    const input = 'Given $f(x) = x^2$, the derivative is $$f\'(x) = 2x$$.';
    const html = renderMarkdownToHtml(input);

    expect(html).toContain('class="katex"');
    expect(html).toContain('class="katex-display"');
  });

  it('converts bracket delimiters \\[ \\] and \\( \\) to KaTeX', () => {
    const input = 'Equation \\[ x^2 + y^2 = 1 \\] with variable \\( x \\).';
    const html = renderMarkdownToHtml(input);

    expect(html).toContain('class="katex"');
    expect(html).toContain('class="katex-display"');
  });

  it('balances unclosed streaming delimiters safely', () => {
    const streamingInline = 'Evaluating $x^2 + 1';
    const htmlInline = renderMarkdownToHtml(streamingInline);
    expect(htmlInline).toContain('class="katex"');

    const streamingBlock = 'Solution:\n$$\\int x dx';
    const htmlBlock = renderMarkdownToHtml(streamingBlock);
    expect(htmlBlock).toContain('class="katex"');
  });

  it('escapes raw HTML script tags to prevent XSS', () => {
    const input = '<script>alert("hack")</script> **safe text**';
    const html = renderMarkdownToHtml(input);

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('<strong>safe text</strong>');
  });

  it('neutralizes javascript: URIs in markdown links', () => {
    const input = '[click me](javascript:alert(1)) and [normal](https://openmath.dev)';
    const html = renderMarkdownToHtml(input);

    expect(html).not.toContain('href="javascript:');
    expect(html).toContain('href="#"');
    expect(html).toContain('href="https://openmath.dev"');
  });

  it('renders markdown tables correctly', () => {
    const input = [
      '| x | f(x) |',
      '|---|------|',
      '| 0 | 1    |',
      '| 1 | 2    |',
    ].join('\n');

    const html = renderMarkdownToHtml(input);
    expect(html).toContain('<table>');
    expect(html).toContain('<th>x</th>');
    expect(html).toContain('<td>1</td>');
  });
});
