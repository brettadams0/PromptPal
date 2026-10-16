import type { VariableUsage } from './engine';
import type { VariableDef, Values } from './schema';

export interface ResolvedVariable extends VariableDef {
  /** True when the template references the variable but never declares it. */
  inferred: boolean;
}

/** `target_audience` → "Target audience" */
export function humanize(name: string): string {
  const words = name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_+/g, ' ')
    .trim()
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * The form a template needs: declared variables that the template actually
 * uses, in declaration order, followed by any it references without
 * declaring. Typing `{{audience}}` into the editor is enough to get an
 * "Audience" field — a variable that is only ever tested with `{{#if}}`
 * becomes a checkbox, everything else a text field.
 */
export function resolveVariables(
  declared: readonly VariableDef[],
  usages: readonly VariableUsage[],
): ResolvedVariable[] {
  const used = new Set(usages.map((u) => u.name));
  const declaredNames = new Set(declared.map((d) => d.name));

  const fromDeclared = declared.filter((d) => used.has(d.name)).map((d) => ({ ...d, inferred: false }));

  const fromUsage = usages
    .filter((u) => !declaredNames.has(u.name))
    .map((u): ResolvedVariable => ({
      name: u.name,
      label: humanize(u.name),
      type: u.interpolated ? 'text' : 'boolean',
      inferred: true,
    }));

  return [...fromDeclared, ...fromUsage];
}

export function unusedDeclarations(declared: readonly VariableDef[], usages: readonly VariableUsage[]): VariableDef[] {
  const used = new Set(usages.map((u) => u.name));
  return declared.filter((d) => !used.has(d.name));
}

/** Initial values for a set of variables, from their declared defaults. */
export function defaultValues(variables: readonly VariableDef[]): Values {
  const values: Values = {};
  for (const v of variables) {
    if (v.defaultValue !== undefined) values[v.name] = v.defaultValue;
    else if (v.type === 'boolean') values[v.name] = false;
  }
  return values;
}

/**
 * Coerces a stored value to the variable's current type. Values outlive type
 * changes — switch a field from text to number in the editor, or load a share
 * link built against an older template — so they are coerced at the edge
 * rather than trusted.
 */
export function coerceValue(variable: VariableDef, value: Values[string] | undefined): Values[string] | undefined {
  if (value === undefined) return undefined;
  switch (variable.type) {
    case 'boolean':
      return value === true || value === 'true' || value === 'yes';
    case 'number': {
      if (typeof value === 'string' && value.trim() === '') return undefined;
      const n = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(n)) return undefined;
      const lo = variable.min ?? -Infinity;
      const hi = variable.max ?? Infinity;
      return Math.min(hi, Math.max(lo, n));
    }
    case 'select': {
      const s = String(value);
      return variable.options?.includes(s) ? s : undefined;
    }
    default:
      return typeof value === 'boolean' ? '' : String(value);
  }
}
