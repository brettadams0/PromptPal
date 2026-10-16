import { describe, expect, it } from 'vitest';
import { getTemplate, templateToDocument } from '@/lib/templates';
import { builderReducer, initialState, isTemplateModified, snapshot } from './state';

const start = () => initialState(templateToDocument(getTemplate('professional-email')!));

describe('builder reducer', () => {
  it('tracks unsaved changes against the last save', () => {
    let state = builderReducer(start(), { type: 'saved', id: 'abc' });
    expect(state.savedSnapshot).toBe(snapshot(state.doc));
    state = builderReducer(state, { type: 'set-value', name: 'purpose', value: 'say thanks' });
    expect(state.savedSnapshot).not.toBe(snapshot(state.doc));
    expect(state.savedId).toBe('abc');
  });

  it('notices template edits and reverts them while keeping filled-in values', () => {
    let state = builderReducer(start(), { type: 'set-value', name: 'recipient', value: 'Sam' });
    state = builderReducer(state, { type: 'set-source', part: 'prompt', text: 'Hi {{recipient}}' });
    expect(isTemplateModified(state.doc)).toBe(true);
    state = builderReducer(state, { type: 'revert-template' });
    expect(isTemplateModified(state.doc)).toBe(false);
    expect(state.doc.values.recipient).toBe('Sam');
  });

  it('declares, replaces and removes variable definitions', () => {
    let state = builderReducer(start(), { type: 'declare', variable: { name: 'extra', label: 'Extra', type: 'text' } });
    expect(state.doc.variables.at(-1)?.name).toBe('extra');
    state = builderReducer(state, { type: 'declare', variable: { name: 'extra', label: 'Renamed', type: 'textarea' } });
    expect(state.doc.variables.filter((v) => v.name === 'extra')).toEqual([
      { name: 'extra', label: 'Renamed', type: 'textarea' },
    ]);
    state = builderReducer(state, { type: 'undeclare', name: 'extra' });
    expect(state.doc.variables.some((v) => v.name === 'extra')).toBe(false);
  });

  it('resets fields to their defaults', () => {
    let state = builderReducer(start(), { type: 'set-value', name: 'tone', value: 'Formal' });
    state = builderReducer(state, { type: 'clear-values' });
    expect(state.doc.values.tone).toBe('Friendly');
  });
});
