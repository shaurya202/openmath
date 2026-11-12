'use client';

import React, { useMemo } from 'react';
import katex from 'katex';
import { renderMarkdownToHtml } from '@/core/math/markdown';

interface MathViewProps {
  content: string;
  className?: string;
  displayMode?: boolean;
}

export const MathView: React.FC<MathViewProps> = ({
  content,
  className = '',
  displayMode = false,
}) => {
  const renderedHtml = useMemo(() => {
    if (!content) return '';

    // If explicit displayMode is passed, render directly as a single block
    if (displayMode) {
      try {
        const cleanContent = content
          .trim()
          .replace(/^\\\[\s*|\s*\\\]$/g, '')
          .replace(/^\\\(\s*|\s*\\\)$/g, '')
          .replace(/^(\$\$|\$)+/g, '')
          .replace(/(\$\$|\$)+$/g, '')
          .trim();

        return katex.renderToString(cleanContent, {
          displayMode: true,
          throwOnError: false,
          strict: false,
        });
      } catch {
        return `<code class="text-red-500 font-mono">${content}</code>`;
      }
    }

    // Parse full markdown with embedded KaTeX math
    return renderMarkdownToHtml(content);
  }, [content, displayMode]);

  if (!content) return null;

  return (
    <div
      className={`math-content select-text leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};
