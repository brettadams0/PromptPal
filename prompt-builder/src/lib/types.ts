/**
 * Task types for prompt generation
 */
export type TaskType = 
  | 'writing'
  | 'coding'
  | 'analysis'
  | 'creative'
  | 'business';

/**
 * Tone options for prompts
 */
export type ToneType = 
  | 'professional'
  | 'casual'
  | 'friendly'
  | 'formal'
  | 'creative'
  | 'technical'
  | 'persuasive'
  | 'informative';

/**
 * Output format options
 */
export type OutputFormat = 
  | 'text'
  | 'markdown'
  | 'json'
  | 'html'
  | 'code'
  | 'list'
  | 'table';

/**
 * Prompt variable types
 */
export type VariableType = 
  | 'text'
  | 'select'
  | 'slider'
  | 'checkbox'
  | 'textarea';

/**
 * Prompt variable interface
 */
export interface PromptVariable {
  key: string;
  type: VariableType;
  label: string;
  description?: string;
  required: boolean;
  defaultValue?: string | number | boolean;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

/**
 * Prompt template interface
 */
export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: TaskType;
  variables: PromptVariable[];
  template: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTokens: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Generated prompt interface
 */
export interface GeneratedPrompt {
  id: string;
  templateId: string;
  variables: Record<string, string | number | boolean>;
  content: string;
  wordCount: number;
  characterCount: number;
  estimatedTokens: number;
  createdAt: Date;
}

/**
 * User preferences interface
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  defaultTaskType: TaskType;
  defaultTone: ToneType;
  defaultFormat: OutputFormat;
  autoSave: boolean;
  showWordCount: boolean;
  showCharacterCount: boolean;
  showTokenEstimate: boolean;
}

/**
 * Form field interface
 */
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'slider' | 'checkbox' | 'radio';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: string | number | boolean;
  validation?: {
    pattern?: string;
    message?: string;
    minLength?: number;
    maxLength?: number;
  };
}

/**
 * Form data interface
 */
export interface FormData {
  [key: string]: string | number | boolean | string[];
}

/**
 * Validation error interface
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * API response interface
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Theme context interface
 */
export interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  isDark: boolean;
}

/**
 * Component props with children
 */
export interface ComponentWithChildren {
  children: React.ReactNode;
}

/**
 * Component props with className
 */
export interface ComponentWithClassName {
  className?: string;
}

/**
 * Button variant types
 */
export type ButtonVariant = 
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive'
  | 'link';

/**
 * Button size types
 */
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Input size types
 */
export type InputSize = 'sm' | 'md' | 'lg';

/**
 * Loading state interface
 */
export interface LoadingState {
  isLoading: boolean;
  error?: string;
} 