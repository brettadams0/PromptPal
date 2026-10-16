import type { TemplateNode, VariableValue, VariableValues } from './ast';

/**
 * A rendered prompt as a list of segments rather than a flat string, so the
 * preview can highlight which spans came from variables (and which variables
 * are still empty) while the copied text is built from exactly the same data.
 */
export type Segment = { kind: 'text'; text: string } | { kind: 'value'; name: string; text: string };

export function isSet(value: VariableValue | undefined): boolean {
  if (value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (typeof value === 'number') return Number.isFinite(value);
  return value;
}

function formatValue(value: VariableValue | undefined): string {
  if (value === undefined || value === false) return '';
  if (value === true) return 'yes';
  return String(value).trim();
}

function walk(nodes: readonly TemplateNode[], values: VariableValues, out: Segment[]): void {
  for (const node of nodes) {
    switch (node.type) {
      case 'text':
        out.push({ kind: 'text', text: node.value });
        break;
      case 'variable':
        out.push({ kind: 'value', name: node.name, text: formatValue(values[node.name]) });
        break;
      case 'conditional': {
        const truthy = isSet(values[node.name]) !== node.negated;
        walk(truthy ? node.consequent : node.alternate, values, out);
        break;
      }
    }
  }
}

/**
 * Normalizes whitespace across segment boundaries: no more than one blank
 * line in a row, and no leading or trailing whitespace overall. Doing this on
 * segments rather than the joined string keeps value boundaries intact, so
 * the preview and the clipboard can never disagree.
 */
function normalize(segments: Segment[]): Segment[] {
  const out: Segment[] = [];
  let trailingNewlines = 0;
  let started = false;

  for (const segment of segments) {
    let text = segment.text;
    if (segment.kind === 'text') {
      text = text.replace(/[ \t]+\n/g, '\n');
      if (!started) text = text.replace(/^\s+/, '');
      // Cap a newline run that continues from the previous segment.
      const leading = /^\n*/.exec(text)![0].length;
      const allowed = Math.max(0, 2 - trailingNewlines);
      if (leading > allowed) text = text.slice(leading - allowed);
      text = text.replace(/\n{3,}/g, '\n\n');
    }
    if (text === '' && segment.kind === 'text') continue;

    out.push({ ...segment, text });
    if (text !== '') {
      started = true;
      const trailing = /\n*$/.exec(text)![0].length;
      trailingNewlines = trailing === text.length ? trailingNewlines + trailing : trailing;
    }
  }

  // Trim the tail: drop trailing whitespace from the last non-empty text.
  for (let i = out.length - 1; i >= 0; i--) {
    const segment = out[i]!;
    if (segment.kind === 'value' && segment.text === '') continue;
    if (segment.kind === 'text') {
      segment.text = segment.text.replace(/\s+$/, '');
      if (segment.text === '') {
        out.splice(i, 1);
        continue;
      }
    }
    break;
  }
  return out;
}

export function renderSegments(nodes: readonly TemplateNode[], values: VariableValues): Segment[] {
  const raw: Segment[] = [];
  walk(nodes, values, raw);
  return normalize(raw);
}

export function segmentsToText(segments: readonly Segment[]): string {
  return segments.map((s) => s.text).join('');
}

export function render(nodes: readonly TemplateNode[], values: VariableValues): string {
  return segmentsToText(renderSegments(nodes, values));
}
