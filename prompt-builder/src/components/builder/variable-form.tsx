'use client';

import { Wand2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import type { Values } from '@/lib/schema';
import { cn } from '@/lib/utils';
import type { ResolvedVariable } from '@/lib/variables';

export const fieldId = (name: string) => `field-${name}`;

interface FieldProps {
  variable: ResolvedVariable;
  value: Values[string] | undefined;
  invalid: boolean;
  onChange: (value: Values[string]) => void;
}

function Field({ variable, value, invalid, onChange }: FieldProps) {
  const id = fieldId(variable.name);
  const helpId = variable.description ? `${id}-help` : undefined;
  const common = {
    id,
    'aria-describedby': helpId,
    'aria-invalid': invalid || undefined,
    'aria-required': variable.required || undefined,
  };

  if (variable.type === 'boolean') {
    return (
      <div className="flex items-start gap-3">
        <Checkbox
          {...common}
          className="mt-0.5"
          checked={value === true}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="grid gap-1">
          <Label htmlFor={id}>{variable.label}</Label>
          {variable.description && (
            <p id={helpId} className="text-muted-foreground text-xs">
              {variable.description}
            </p>
          )}
        </div>
      </div>
    );
  }

  let control: React.ReactNode;
  switch (variable.type) {
    case 'textarea':
      control = (
        <Textarea
          {...common}
          rows={5}
          value={typeof value === 'string' ? value : ''}
          placeholder={variable.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cn('min-h-28 resize-y', variable.monospace && 'font-mono text-[13px]')}
        />
      );
      break;
    case 'select':
      control = (
        <Select value={typeof value === 'string' ? value : ''} onValueChange={onChange}>
          <SelectTrigger {...common}>
            <SelectValue placeholder="Choose…" />
          </SelectTrigger>
          <SelectContent>
            {(variable.options ?? []).map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
      break;
    case 'number': {
      const n = typeof value === 'number' ? value : undefined;
      const bounded = variable.min !== undefined && variable.max !== undefined;
      control = (
        <div className="flex items-center gap-3">
          {bounded && (
            <Slider
              aria-label={variable.label}
              className="flex-1"
              min={variable.min}
              max={variable.max}
              step={variable.step ?? 1}
              value={[n ?? variable.min!]}
              onValueChange={([v]) => v !== undefined && onChange(v)}
            />
          )}
          <Input
            {...common}
            type="number"
            inputMode="numeric"
            className={bounded ? 'w-24' : undefined}
            min={variable.min}
            max={variable.max}
            step={variable.step}
            value={n ?? ''}
            onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          />
        </div>
      );
      break;
    }
    default:
      control = (
        <Input
          {...common}
          value={typeof value === 'string' ? value : ''}
          placeholder={variable.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-2">
        <Label htmlFor={id}>{variable.label}</Label>
        {variable.required && <span className="text-muted-foreground text-xs">Required</span>}
        {variable.inferred && (
          <Badge variant="outline" title="Found in the template but not declared. Configure it under Template.">
            <Wand2 className="size-3" aria-hidden /> inferred
          </Badge>
        )}
      </div>
      {control}
      {variable.description && (
        <p id={helpId} className="text-muted-foreground text-xs">
          {variable.description}
        </p>
      )}
    </div>
  );
}

interface VariableFormProps {
  variables: readonly ResolvedVariable[];
  values: Values;
  invalid: ReadonlySet<string>;
  onChange: (name: string, value: Values[string]) => void;
}

export function VariableForm({ variables, values, invalid, onChange }: VariableFormProps) {
  if (variables.length === 0) {
    return (
      <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
        <p className="text-foreground font-medium">No fields yet</p>
        <p className="mt-1">
          Add a placeholder like <code className="text-foreground font-mono">{'{{topic}}'}</code> in the Template tab
          and a field for it appears here.
        </p>
      </div>
    );
  }

  return (
    <form className="grid gap-5" onSubmit={(e) => e.preventDefault()} aria-label="Template fields">
      {variables.map((variable) => (
        <Field
          key={variable.name}
          variable={variable}
          value={values[variable.name]}
          invalid={invalid.has(variable.name)}
          onChange={(value) => onChange(variable.name, value)}
        />
      ))}
    </form>
  );
}
