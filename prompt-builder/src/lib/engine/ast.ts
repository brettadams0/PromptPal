/**
 * The template language is deliberately small: interpolation, two conditional
 * blocks and comments. Anything richer (loops, filters, partials) would turn a
 * prompt template into a program, and a prompt you cannot read top to bottom
 * is worse at its one job.
 *
 *   {{ name }}                      insert a variable
 *   {{#if name}} … {{else}} … {{/if}}   render a branch when `name` is set
 *   {{#unless name}} … {{/unless}}  the inverse
 *   {{! a comment }}                stripped from the output
 *   \{{                             a literal "{{"
 */

/** A position in the template source. Lines and columns are 1-based. */
export interface SourceLocation {
  /** 0-based offset of the first character of the tag. */
  offset: number;
  /** Length of the tag in characters, `{{` through `}}`. */
  length: number;
  line: number;
  column: number;
}

export interface TextNode {
  type: 'text';
  value: string;
}

export interface VariableNode {
  type: 'variable';
  name: string;
  loc: SourceLocation;
}

export interface ConditionalNode {
  type: 'conditional';
  /** `#unless` is represented as a negated `#if`. */
  negated: boolean;
  name: string;
  consequent: TemplateNode[];
  alternate: TemplateNode[];
  loc: SourceLocation;
}

export type TemplateNode = TextNode | VariableNode | ConditionalNode;

export class TemplateSyntaxError extends Error {
  readonly loc: SourceLocation;

  constructor(message: string, loc: SourceLocation) {
    super(message);
    this.name = 'TemplateSyntaxError';
    this.loc = loc;
  }
}

export type ParseResult = { ok: true; nodes: TemplateNode[] } | { ok: false; error: TemplateSyntaxError };

export type VariableValue = string | number | boolean;
export type VariableValues = Readonly<Record<string, VariableValue | undefined>>;
