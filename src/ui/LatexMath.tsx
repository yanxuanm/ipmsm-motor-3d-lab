import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LatexMathProps {
  math: string;
  block?: boolean;
  className?: string;
}

const renderCache = new Map<string, string>();

export function renderLatexToHtml(math: string, block: boolean = false): string {
  const cacheKey = `${block ? 'B' : 'I'}:${math}`;
  const cached = renderCache.get(cacheKey);
  if (cached) return cached;

  try {
    const rendered = katex.renderToString(math, {
      displayMode: block,
      throwOnError: false,
      strict: false,
      trust: true
    });
    renderCache.set(cacheKey, rendered);
    return rendered;
  } catch {
    return math;
  }
}

export const LatexMath: React.FC<LatexMathProps> = React.memo(({
  math,
  block = false,
  className = ''
}) => {
  const html = useMemo(() => renderLatexToHtml(math, block), [math, block]);

  if (block) {
    return (
      <div
        className={`katex-block overflow-x-auto py-1 ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      className={`katex-inline ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});

interface MathTextProps {
  text: string;
  className?: string;
}

/**
 * Renders mixed Chinese/English prose containing inline `$...$` LaTeX math expressions.
 */
export const MathText: React.FC<MathTextProps> = React.memo(({ text, className = '' }) => {
  const parts = useMemo(() => {
    const segments = text.split(/(\$[^$]+\$)/g);
    return segments.map((seg, i) => {
      if (seg.startsWith('$') && seg.endsWith('$') && seg.length > 2) {
        const latex = seg.slice(1, -1);
        return {
          key: i,
          isMath: true,
          content: renderLatexToHtml(latex, false)
        };
      }
      return {
        key: i,
        isMath: false,
        content: seg
      };
    });
  }, [text]);

  return (
    <span className={className}>
      {parts.map(p =>
        p.isMath ? (
          <span
            key={p.key}
            className="mx-0.5 text-cyan-200"
            dangerouslySetInnerHTML={{ __html: p.content }}
          />
        ) : (
          <React.Fragment key={p.key}>{p.content}</React.Fragment>
        )
      )}
    </span>
  );
});
