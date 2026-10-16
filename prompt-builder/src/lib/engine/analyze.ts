import type { SourceLocation, TemplateNode } from './ast';

export interface VariableUsage {
  name: string;
  /** Interpolated somewhere with {{name}}. */
  interpolated: boolean;
  /** Tested by an {{#if}} or {{#unless}}. */
  conditional: boolean;
  /** First appearance, for ordering inferred fields and pointing at usages. */
  firstLoc: SourceLocation;
}

/**
 * Every variable a template references, in order of first appearance. Order
 * matters: inferred form fields appear in the same order the reader meets
 * them in the template.
 */
export function analyze(nodes: readonly TemplateNode[]): VariableUsage[] {
  const byName = new Map<string, VariableUsage>();

  const visit = (list: readonly TemplateNode[]) => {
    for (const node of list) {
      if (node.type === 'text') continue;
      let usage = byName.get(node.name);
      if (!usage) {
        usage = { name: node.name, interpolated: false, conditional: false, firstLoc: node.loc };
        byName.set(node.name, usage);
      }
      if (node.type === 'variable') {
        usage.interpolated = true;
      } else {
        usage.conditional = true;
        visit(node.consequent);
        visit(node.alternate);
      }
    }
  };

  visit(nodes);
  return [...byName.values()];
}

/** Merges usages from several templates (system + prompt), first appearance wins. */
export function mergeUsages(...lists: VariableUsage[][]): VariableUsage[] {
  const byName = new Map<string, VariableUsage>();
  for (const list of lists) {
    for (const usage of list) {
      const existing = byName.get(usage.name);
      if (existing) {
        existing.interpolated ||= usage.interpolated;
        existing.conditional ||= usage.conditional;
      } else {
        byName.set(usage.name, { ...usage });
      }
    }
  }
  return [...byName.values()];
}
