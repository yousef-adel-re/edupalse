// src/lib/mathUtils.js

/**
 * Normalizes and formats raw AI & user text containing LaTeX math expressions
 * so that remark-math and rehype-katex render them perfectly.
 */
export function formatMathExpressions(text) {
  if (!text || typeof text !== 'string') return text || '';

  let formatted = text;

  // 1. Replace display math brackets \[ ... \] with $$ ... $$
  formatted = formatted.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `\n$$\n${math.trim()}\n$$\n`);

  // 2. Replace inline math parentheses \( ... \) with $ ... $
  formatted = formatted.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math.trim()}$`);

  // 3. Fix double backslashes (e.g. \\frac -> \frac)
  formatted = formatted.replace(/\\\\(frac|sqrt|sum|int|lim|alpha|beta|gamma|delta|theta|pi|sigma|omega|infty|pm|times|div|approx|neq|leq|geq|cdot|left|right|vec|hat)/g, '\\$1');

  // 4. Wrap bare unescaped LaTeX commands like \frac{a}{b} or \sqrt{x} in $ ... $ if not already enclosed
  formatted = formatted.replace(/(?<!\$)\\(frac|sqrt|sum|int|lim|vec|hat)\{([^{}]+)\}(?:\{([^{}]+)\})?(?!\$)/g, '$$&$');

  // 5. Wrap bare subscript variables like t_{rr} or Q_{RR} or I_{RR} in $ ... $ if not already enclosed in $
  formatted = formatted.replace(/(?<![\$\w])([a-zA-Z]_\{\w+\})(?![\$\w])/g, '$$1$');

  return formatted;
}
