'use client';

import React, { useMemo } from 'react';
import katex from 'katex';
import { parseMathSegments, ParsedMathSegment } from '@/core/math/latex';

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
  const renderedContent = useMemo(() => {
    if (!content) return null;

    // If explicit displayMode is passed, render directly as a single block
    if (displayMode) {
      try {
        // Strip enclosing $$, $, \[, \] or \(, \) so KaTeX parses pure math expressions
        const cleanContent = content
          .trim()
          .replace(/^\\\[\s*|\s*\\\]$/g, '')
          .replace(/^\\\(\s*|\s*\\\)$/g, '')
          .replace(/^(\$\$|\$)+/g, '')
          .replace(/(\$\$|\$)+$/g, '')
          .trim();

        const html = katex.renderToString(cleanContent, {
          displayMode: true,
          throwOnError: false,
          strict: false,
        });
        return (
          <span
            dir="ltr"
            className="block my-2 overflow-x-auto py-1"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      } catch (e) {
        return <code className="text-red-500 font-mono">{content}</code>;
      }
    }

    // Otherwise parse mixed text and math segments
    const segments = parseMathSegments(content);

    return segments.map((seg: ParsedMathSegment, idx: number) => {
      if (seg.type === 'text') {
        return <span key={idx}>{seg.content}</span>;
      }

      try {
        const isDisplay = seg.type === 'display-math';
        const html = katex.renderToString(seg.content, {
          displayMode: isDisplay,
          throwOnError: false,
          strict: false,
        });

        if (isDisplay) {
          return (
            <span
              key={idx}
              dir="ltr"
              className="block my-2 overflow-x-auto py-1 text-center"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        return (
          <span
            key={idx}
            dir="ltr"
            className="inline-block px-1 align-baseline"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      } catch (err) {
        return (
          <code key={idx} className="bg-red-50 text-red-600 px-1 rounded text-sm">
            {seg.content}
          </code>
        );
      }
    });
  }, [content, displayMode]);

  return <div className={`math-content select-text leading-relaxed ${className}`}>{renderedContent}</div>;
};
