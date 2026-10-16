import type { PromptPart } from '@/lib/lint';
import type { PromptDocument, VariableDef, Values } from '@/lib/schema';
import { getTemplate, templateToDocument } from '@/lib/templates';
import { defaultValues } from '@/lib/variables';

export interface BuilderState {
  doc: PromptDocument;
  /** Library entry this document was opened from or last saved to. */
  savedId: string | null;
  /** The document as last saved, to tell whether there are unsaved changes. */
  savedSnapshot: string | null;
}

export type BuilderAction =
  | { type: 'load'; doc: PromptDocument; savedId?: string | null }
  | { type: 'saved'; id: string }
  | { type: 'rename'; name: string }
  | { type: 'set-value'; name: string; value: Values[string] }
  | { type: 'set-source'; part: PromptPart; text: string }
  | { type: 'declare'; variable: VariableDef }
  | { type: 'undeclare'; name: string }
  | { type: 'revert-template' }
  | { type: 'clear-values' };

export const snapshot = (doc: PromptDocument) => JSON.stringify(doc);

export function initialState(doc: PromptDocument, savedId: string | null = null): BuilderState {
  return { doc, savedId, savedSnapshot: savedId ? snapshot(doc) : null };
}

export function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  const { doc } = state;
  switch (action.type) {
    case 'load':
      return initialState(action.doc, action.savedId ?? null);
    case 'saved':
      return { ...state, savedId: action.id, savedSnapshot: snapshot(doc) };
    case 'rename':
      return { ...state, doc: { ...doc, name: action.name } };
    case 'set-value':
      return { ...state, doc: { ...doc, values: { ...doc.values, [action.name]: action.value } } };
    case 'set-source':
      return { ...state, doc: { ...doc, [action.part]: action.text } };
    case 'declare': {
      const exists = doc.variables.some((v) => v.name === action.variable.name);
      const variables = exists
        ? doc.variables.map((v) => (v.name === action.variable.name ? action.variable : v))
        : [...doc.variables, action.variable];
      return { ...state, doc: { ...doc, variables } };
    }
    case 'undeclare':
      return { ...state, doc: { ...doc, variables: doc.variables.filter((v) => v.name !== action.name) } };
    case 'revert-template': {
      const template = doc.templateId ? getTemplate(doc.templateId) : undefined;
      if (!template) return state;
      const fresh = templateToDocument(template);
      return {
        ...state,
        doc: {
          ...doc,
          system: fresh.system,
          prompt: fresh.prompt,
          variables: fresh.variables,
          category: fresh.category,
          values: { ...fresh.values, ...doc.values },
        },
      };
    }
    case 'clear-values':
      return { ...state, doc: { ...doc, values: defaultValues(doc.variables) } };
  }
}

/** True when the template source differs from the library template it came from. */
export function isTemplateModified(doc: PromptDocument): boolean {
  const template = doc.templateId ? getTemplate(doc.templateId) : undefined;
  if (!template) return false;
  return (
    template.system !== doc.system ||
    template.prompt !== doc.prompt ||
    JSON.stringify(template.variables) !== JSON.stringify(doc.variables)
  );
}
