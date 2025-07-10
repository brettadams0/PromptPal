import { TaskType, ToneType, OutputFormat } from './types';

/**
 * Task type configurations
 */
export const TASK_TYPES: Record<TaskType, { label: string; description: string; icon: string }> = {
  writing: {
    label: 'Writing',
    description: 'Essays, articles, creative writing, and content creation',
    icon: '📝',
  },
  coding: {
    label: 'Coding',
    description: 'Debugging, code review, documentation, and programming help',
    icon: '💻',
  },
  analysis: {
    label: 'Analysis',
    description: 'Data analysis, research, summarization, and insights',
    icon: '📊',
  },
  creative: {
    label: 'Creative',
    description: 'Brainstorming, ideation, storytelling, and creative projects',
    icon: '🎨',
  },
  business: {
    label: 'Business',
    description: 'Emails, proposals, presentations, and professional communication',
    icon: '💼',
  },
};

/**
 * Tone options
 */
export const TONE_OPTIONS: Record<ToneType, { label: string; description: string }> = {
  professional: {
    label: 'Professional',
    description: 'Formal and business-appropriate',
  },
  casual: {
    label: 'Casual',
    description: 'Relaxed and conversational',
  },
  friendly: {
    label: 'Friendly',
    description: 'Warm and approachable',
  },
  formal: {
    label: 'Formal',
    description: 'Strict and traditional',
  },
  creative: {
    label: 'Creative',
    description: 'Imaginative and expressive',
  },
  technical: {
    label: 'Technical',
    description: 'Precise and detailed',
  },
  persuasive: {
    label: 'Persuasive',
    description: 'Convincing and compelling',
  },
  informative: {
    label: 'Informative',
    description: 'Educational and clear',
  },
};

/**
 * Output format options
 */
export const OUTPUT_FORMATS: Record<OutputFormat, { label: string; description: string }> = {
  text: {
    label: 'Plain Text',
    description: 'Simple text format',
  },
  markdown: {
    label: 'Markdown',
    description: 'Formatted with markdown syntax',
  },
  json: {
    label: 'JSON',
    description: 'Structured data format',
  },
  html: {
    label: 'HTML',
    description: 'Web-ready HTML format',
  },
  code: {
    label: 'Code',
    description: 'Programming code format',
  },
  list: {
    label: 'List',
    description: 'Bullet point or numbered list',
  },
  table: {
    label: 'Table',
    description: 'Tabular data format',
  },
};

/**
 * Default user preferences
 */
export const DEFAULT_PREFERENCES = {
  theme: 'system' as const,
  defaultTaskType: 'writing' as TaskType,
  defaultTone: 'professional' as ToneType,
  defaultFormat: 'text' as OutputFormat,
  autoSave: true,
  showWordCount: true,
  showCharacterCount: true,
  showTokenEstimate: true,
};

/**
 * Performance targets
 */
export const PERFORMANCE_TARGETS = {
  firstContentfulPaint: 1500, // 1.5s
  largestContentfulPaint: 2500, // 2.5s
  cumulativeLayoutShift: 0.1,
  firstInputDelay: 100, // 100ms
};

/**
 * Responsive breakpoints
 */
export const BREAKPOINTS = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  preferences: 'promptpal-preferences',
  promptHistory: 'promptpal-history',
  favorites: 'promptpal-favorites',
  theme: 'promptpal-theme',
};

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  templates: '/api/templates',
  generate: '/api/generate',
  save: '/api/save',
  export: '/api/export',
};

/**
 * Validation rules
 */
export const VALIDATION_RULES = {
  maxPromptLength: 10000,
  maxVariableLength: 500,
  maxTemplateLength: 50000,
  minPromptLength: 10,
};

/**
 * Animation durations
 */
export const ANIMATION_DURATIONS = {
  fast: 150,
  normal: 300,
  slow: 500,
};

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  required: 'This field is required',
  invalidEmail: 'Please enter a valid email address',
  minLength: (min: number) => `Must be at least ${min} characters`,
  maxLength: (max: number) => `Must be no more than ${max} characters`,
  invalidFormat: 'Invalid format',
  networkError: 'Network error. Please try again.',
  unknownError: 'An unknown error occurred.',
};

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  promptGenerated: 'Prompt generated successfully!',
  promptSaved: 'Prompt saved to favorites!',
  promptCopied: 'Prompt copied to clipboard!',
  preferencesSaved: 'Preferences saved!',
  promptExported: 'Prompt exported successfully!',
}; 