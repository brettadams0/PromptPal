import { z } from 'zod';

/**
 * Schemas for everything that crosses a trust boundary: share links arrive
 * from a URL anyone can edit, and saved prompts come back out of localStorage
 * written by whatever version of the app ran last. Both are parsed here
 * rather than cast, and the TypeScript types are inferred from these
 * definitions so the two can never drift apart.
 */

export const CATEGORIES = ['writing', 'coding', 'analysis', 'creative', 'business'] as const;
export const categorySchema = z.enum(CATEGORIES);
export type Category = z.infer<typeof categorySchema>;

export const VARIABLE_TYPES = ['text', 'textarea', 'select', 'number', 'boolean'] as const;
export const variableTypeSchema = z.enum(VARIABLE_TYPES);
export type VariableType = z.infer<typeof variableTypeSchema>;

const identifier = z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/);
const valueSchema = z.union([z.string().max(50_000), z.number().finite(), z.boolean()]);

export const variableDefSchema = z.object({
  name: identifier,
  label: z.string().max(120),
  type: variableTypeSchema,
  required: z.boolean().optional(),
  description: z.string().max(500).optional(),
  placeholder: z.string().max(500).optional(),
  /** Render the field in a monospace font, for code and logs. */
  monospace: z.boolean().optional(),
  options: z.array(z.string().max(200)).max(50).optional(),
  min: z.number().finite().optional(),
  max: z.number().finite().optional(),
  step: z.number().positive().finite().optional(),
  defaultValue: valueSchema.optional(),
});
export type VariableDef = z.infer<typeof variableDefSchema>;

export const valuesSchema = z.record(identifier, valueSchema);
export type Values = z.infer<typeof valuesSchema>;

/** The editable state of the builder: a template plus the values filled into it. */
export const promptDocumentSchema = z.object({
  name: z.string().max(200),
  category: categorySchema,
  /** The library template this document started from, if any. */
  templateId: z.string().max(100).optional(),
  system: z.string().max(50_000),
  prompt: z.string().max(50_000),
  variables: z.array(variableDefSchema).max(100),
  values: valuesSchema,
});
export type PromptDocument = z.infer<typeof promptDocumentSchema>;

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: Category;
  tags: string[];
  system: string;
  prompt: string;
  variables: VariableDef[];
}
