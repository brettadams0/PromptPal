import {
  type ConditionalNode,
  type ParseResult,
  type SourceLocation,
  type TemplateNode,
  TemplateSyntaxError,
} from './ast';

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

type Tag =
  | { kind: 'variable'; name: string }
  | { kind: 'open'; block: 'if' | 'unless'; name: string }
  | { kind: 'else' }
  | { kind: 'close'; block: 'if' | 'unless' }
  | { kind: 'comment' };

type Token = { type: 'text'; value: string } | { type: 'tag'; tag: Tag; loc: SourceLocation };

/** Maps offsets to 1-based line/column, built once per parse. */
function locator(source: string) {
  const lineStarts = [0];
  for (let i = 0; i < source.length; i++) {
    if (source[i] === '\n') lineStarts.push(i + 1);
  }
  return (offset: number, length: number): SourceLocation => {
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineStarts[mid]! <= offset) lo = mid;
      else hi = mid - 1;
    }
    return { offset, length, line: lo + 1, column: offset - lineStarts[lo]! + 1 };
  };
}

function classify(inner: string, loc: SourceLocation): Tag {
  const body = inner.trim();

  if (body.startsWith('!')) return { kind: 'comment' };
  if (body === 'else') return { kind: 'else' };

  if (body.startsWith('#')) {
    const [helper = '', name, ...rest] = body.slice(1).trim().split(/\s+/);
    if (helper !== 'if' && helper !== 'unless') {
      throw new TemplateSyntaxError(`Unknown block "#${helper}". Supported blocks are #if and #unless.`, loc);
    }
    if (!name) {
      throw new TemplateSyntaxError(`{{#${helper}}} needs a variable name, e.g. {{#${helper} topic}}.`, loc);
    }
    if (rest.length > 0 || !IDENTIFIER.test(name)) {
      throw new TemplateSyntaxError(
        `{{#${helper}}} takes a single variable name; got "${body.slice(helper.length + 1).trim()}".`,
        loc,
      );
    }
    return { kind: 'open', block: helper, name };
  }

  if (body.startsWith('/')) {
    const helper = body.slice(1).trim();
    if (helper !== 'if' && helper !== 'unless') {
      throw new TemplateSyntaxError(`Unknown closing tag "{{/${helper}}}".`, loc);
    }
    return { kind: 'close', block: helper };
  }

  if (body === '') {
    throw new TemplateSyntaxError('Empty tag "{{}}". Put a variable name between the braces.', loc);
  }
  if (!IDENTIFIER.test(body)) {
    throw new TemplateSyntaxError(
      `"${body}" is not a valid variable name. Use letters, digits and underscores, starting with a letter.`,
      loc,
    );
  }
  return { kind: 'variable', name: body };
}

const isBlank = (s: string) => /^[ \t]*$/.test(s);

/**
 * Splits the source into text and tags.
 *
 * Block tags and comments that sit alone on their line are "standalone", as
 * in Mustache: the whole line, newline included, is removed from the output.
 * That is what lets a template put `{{#if context}}` on its own line without
 * leaving a blank line behind in every rendered prompt.
 */
function tokenize(source: string): Token[] {
  const at = locator(source);
  const tokens: Token[] = [];
  let text = '';
  let cursor = 0;
  // Whether `text` began at the start of a line. False after a tag that left
  // the cursor mid-line, so a later block tag on that line is not standalone.
  let textStartsLine = true;

  while (cursor < source.length) {
    const open = source.indexOf('{{', cursor);
    if (open === -1) {
      text += source.slice(cursor);
      break;
    }

    // `\{{` is an escaped literal; the backslash is dropped.
    if (open > 0 && source[open - 1] === '\\') {
      text += source.slice(cursor, open - 1) + '{{';
      cursor = open + 2;
      continue;
    }

    const close = source.indexOf('}}', open + 2);
    if (close === -1) {
      throw new TemplateSyntaxError('Unclosed tag: "{{" has no matching "}}".', at(open, 2));
    }
    const nested = source.indexOf('{{', open + 2);
    if (nested !== -1 && nested < close) {
      throw new TemplateSyntaxError('Unclosed tag: "{{" has no matching "}}".', at(open, nested - open));
    }

    const end = close + 2;
    const loc = at(open, end - open);
    const tag = classify(source.slice(open + 2, close), loc);
    text += source.slice(cursor, open);
    cursor = end;

    if (tag.kind !== 'variable') {
      const lineStart = text.lastIndexOf('\n') + 1;
      const ownsLine = lineStart > 0 || textStartsLine;
      const newline = source.indexOf('\n', end);
      const after = source.slice(end, newline === -1 ? source.length : newline);
      if (ownsLine && isBlank(text.slice(lineStart)) && isBlank(after)) {
        text = text.slice(0, lineStart);
        cursor = newline === -1 ? source.length : newline + 1;
        if (text) tokens.push({ type: 'text', value: text });
        tokens.push({ type: 'tag', tag, loc });
        text = '';
        textStartsLine = true;
        continue;
      }
    }

    if (text) tokens.push({ type: 'text', value: text });
    tokens.push({ type: 'tag', tag, loc });
    text = '';
    textStartsLine = false;
  }

  if (text) tokens.push({ type: 'text', value: text });
  return tokens;
}

interface Frame {
  node: ConditionalNode;
  block: 'if' | 'unless';
  inElse: boolean;
}

export function parse(source: string): ParseResult {
  let tokens: Token[];
  try {
    tokens = tokenize(source);
  } catch (error) {
    if (error instanceof TemplateSyntaxError) return { ok: false, error };
    throw error;
  }

  const root: TemplateNode[] = [];
  const stack: Frame[] = [];
  const target = (): TemplateNode[] => {
    const frame = stack[stack.length - 1];
    if (!frame) return root;
    return frame.inElse ? frame.node.alternate : frame.node.consequent;
  };

  for (const token of tokens) {
    if (token.type === 'text') {
      target().push({ type: 'text', value: token.value });
      continue;
    }
    const { tag, loc } = token;
    switch (tag.kind) {
      case 'comment':
        break;
      case 'variable':
        target().push({ type: 'variable', name: tag.name, loc });
        break;
      case 'open': {
        const node: ConditionalNode = {
          type: 'conditional',
          negated: tag.block === 'unless',
          name: tag.name,
          consequent: [],
          alternate: [],
          loc,
        };
        target().push(node);
        stack.push({ node, block: tag.block, inElse: false });
        break;
      }
      case 'else': {
        const frame = stack[stack.length - 1];
        if (!frame) {
          return fail('{{else}} must be inside an {{#if}} or {{#unless}} block.', loc);
        }
        if (frame.inElse) {
          return fail(`{{#${frame.block} ${frame.node.name}}} already has an {{else}}.`, loc);
        }
        frame.inElse = true;
        break;
      }
      case 'close': {
        const frame = stack.pop();
        if (!frame) {
          return fail(`{{/${tag.block}}} has no matching {{#${tag.block}}}.`, loc);
        }
        if (frame.block !== tag.block) {
          return fail(
            `Expected {{/${frame.block}}} to close {{#${frame.block} ${frame.node.name}}} ` +
              `from line ${frame.node.loc.line}, found {{/${tag.block}}}.`,
            loc,
          );
        }
        break;
      }
    }
  }

  const unclosed = stack.pop();
  if (unclosed) {
    return fail(
      `{{#${unclosed.block} ${unclosed.node.name}}} is never closed. Add {{/${unclosed.block}}}.`,
      unclosed.node.loc,
    );
  }
  return { ok: true, nodes: mergeText(root) };
}

function fail(message: string, loc: SourceLocation): ParseResult {
  return { ok: false, error: new TemplateSyntaxError(message, loc) };
}

/** Comments and standalone stripping can leave adjacent text nodes; join them. */
function mergeText(nodes: TemplateNode[]): TemplateNode[] {
  const out: TemplateNode[] = [];
  for (const node of nodes) {
    const prev = out[out.length - 1];
    if (node.type === 'text' && prev?.type === 'text') {
      prev.value += node.value;
    } else if (node.type === 'conditional') {
      out.push({ ...node, consequent: mergeText(node.consequent), alternate: mergeText(node.alternate) });
    } else {
      out.push(node.type === 'text' ? { ...node } : node);
    }
  }
  return out;
}
