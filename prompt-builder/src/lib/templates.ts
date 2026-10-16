import type { Category, PromptDocument, PromptTemplate } from './schema';
import { defaultValues } from './variables';

export const CATEGORY_META: Record<Category, { label: string; description: string }> = {
  writing: { label: 'Writing', description: 'Drafting, outlining and editing prose' },
  coding: { label: 'Coding', description: 'Review, debugging and tests' },
  analysis: { label: 'Analysis', description: 'Summaries, comparisons and decisions' },
  creative: { label: 'Creative', description: 'Ideas and fiction' },
  business: { label: 'Business', description: 'Email, meetings and hiring' },
};

const TONES = ['Neutral', 'Friendly', 'Formal', 'Direct', 'Enthusiastic'];

/**
 * Conventions every template follows, and which templates.test.ts enforces:
 * pasted material goes inside XML-style tags so the model can tell input from
 * instruction; optional context sits behind {{#if}} so an empty field leaves
 * no trace; every declared variable is used and every used variable declared.
 */
export const TEMPLATES: PromptTemplate[] = [
  {
    id: 'code-review',
    name: 'Code review',
    description: 'A focused review that ranks findings by severity and skips style nits unless asked.',
    category: 'coding',
    tags: ['review', 'bugs', 'security'],
    system:
      'You are a senior {{language}} engineer doing a code review. You are precise, you explain why something is a problem, and you never invent issues to look thorough.',
    prompt: `Review the following {{language}} code.

<code>
{{code}}
</code>

{{#if context}}
<context>
{{context}}
</context>

{{/if}}
Focus on: {{focus}}.
{{#unless include_style}}
Ignore formatting and naming unless it hides a bug.
{{/unless}}

For each finding, give the line or function, the severity (critical, major, minor), what goes wrong and when, and a concrete fix. If you find nothing worth changing, say so plainly rather than padding the review.`,
    variables: [
      {
        name: 'language',
        label: 'Language',
        type: 'select',
        options: ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Java', 'SQL', 'C#'],
        defaultValue: 'TypeScript',
      },
      {
        name: 'code',
        label: 'Code',
        monospace: true,
        type: 'textarea',
        required: true,
        placeholder: 'Paste the code to review',
      },
      {
        name: 'context',
        label: 'Context',
        type: 'textarea',
        description: 'What the code is for, constraints, what changed.',
        placeholder: 'Optional',
      },
      {
        name: 'focus',
        label: 'Focus on',
        type: 'select',
        options: [
          'correctness and edge cases',
          'security',
          'performance',
          'readability and maintainability',
          'all of the above',
        ],
        defaultValue: 'correctness and edge cases',
      },
      { name: 'include_style', label: 'Include style feedback', type: 'boolean', defaultValue: false },
    ],
  },
  {
    id: 'debug-error',
    name: 'Debug an error',
    description: 'Hand over the error, the code and what you tried; get ranked hypotheses and a way to confirm each.',
    category: 'coding',
    tags: ['debugging', 'stack trace'],
    system:
      'You are an experienced engineer helping a colleague debug. Reason from the evidence given; when the evidence is insufficient, say what you would need to see.',
    prompt: `I'm getting this error:

<error>
{{error}}
</error>

{{#if code}}
The relevant code:

<code>
{{code}}
</code>

{{/if}}
{{#if expected}}
What I expected to happen: {{expected}}

{{/if}}
{{#if tried}}
What I've already tried: {{tried}}

{{/if}}
Environment: {{environment}}

List the most likely causes in order of probability. For each, explain the reasoning, and give one quick check that would confirm or rule it out. Then give the fix for the most likely cause.`,
    variables: [
      { name: 'error', label: 'Error message or stack trace', monospace: true, type: 'textarea', required: true },
      { name: 'code', label: 'Relevant code', monospace: true, type: 'textarea', placeholder: 'Optional' },
      { name: 'expected', label: 'Expected behaviour', type: 'text', placeholder: 'Optional' },
      { name: 'tried', label: 'Already tried', type: 'textarea', placeholder: 'Optional' },
      {
        name: 'environment',
        label: 'Environment',
        type: 'text',
        placeholder: 'e.g. Node 22, Next.js 16, macOS',
        defaultValue: 'not specified',
      },
    ],
  },
  {
    id: 'unit-tests',
    name: 'Write unit tests',
    description: 'Tests that pin down behaviour, including the edge cases, in the framework you already use.',
    category: 'coding',
    tags: ['testing'],
    system: 'You write tests that fail for exactly one reason and read like a specification of the code under test.',
    prompt: `Write {{framework}} tests for this code:

<code>
{{code}}
</code>

Cover the main behaviour, then edge cases: empty and boundary inputs, invalid input, and error paths. Name each test after the behaviour it checks, not the function it calls. Do not mock anything the code does not reach across a process or network boundary.
{{#if coverage_notes}}

Pay particular attention to: {{coverage_notes}}
{{/if}}

Return a single runnable test file, followed by a short list of any behaviour you found ambiguous.`,
    variables: [
      {
        name: 'framework',
        label: 'Test framework',
        type: 'select',
        options: ['Vitest', 'Jest', 'pytest', 'Go testing', 'JUnit 5', 'RSpec'],
        defaultValue: 'Vitest',
      },
      { name: 'code', label: 'Code under test', monospace: true, type: 'textarea', required: true },
      {
        name: 'coverage_notes',
        label: 'Anything to emphasise',
        type: 'text',
        placeholder: 'Optional, e.g. timezone handling',
      },
    ],
  },
  {
    id: 'summarize-document',
    name: 'Summarize a document',
    description: 'A summary sized and shaped for a specific reader, with quotes kept separate from interpretation.',
    category: 'analysis',
    tags: ['summary', 'reading'],
    system: '',
    prompt: `Summarize the document below for {{audience}}.

<document>
{{document}}
</document>

Length: {{length}}.
{{#if focus}}
Prioritise anything about {{focus}}.
{{/if}}
{{#if include_quotes}}
Support each key point with a short direct quote from the document, in quotation marks.
{{/if}}

Start with a one-sentence takeaway. Do not include anything the document does not say; if it leaves an important question open, note that at the end.`,
    variables: [
      { name: 'document', label: 'Document', type: 'textarea', required: true, placeholder: 'Paste the text' },
      {
        name: 'audience',
        label: 'Audience',
        type: 'text',
        defaultValue: 'a busy executive with no background on the topic',
      },
      {
        name: 'length',
        label: 'Length',
        type: 'select',
        options: ['three bullet points', 'one paragraph', 'half a page', 'a detailed brief with headings'],
        defaultValue: 'three bullet points',
      },
      { name: 'focus', label: 'Focus', type: 'text', placeholder: 'Optional, e.g. risks and costs' },
      { name: 'include_quotes', label: 'Back points with quotes', type: 'boolean', defaultValue: false },
    ],
  },
  {
    id: 'decision-matrix',
    name: 'Compare options',
    description: 'Weigh alternatives against explicit criteria and get a recommendation that names its assumptions.',
    category: 'analysis',
    tags: ['decision', 'trade-offs'],
    system: 'You are a careful analyst. You separate facts from assumptions and you are willing to recommend.',
    prompt: `I need to decide: {{decision}}

The options:
<options>
{{options}}
</options>

The criteria that matter, most important first:
<criteria>
{{criteria}}
</criteria>
{{#if constraints}}

Hard constraints: {{constraints}}
{{/if}}

Produce a table scoring each option 1–5 against each criterion with a one-line justification per cell. Then recommend one option, state the assumptions the recommendation depends on, and name what new information would change it.`,
    variables: [
      {
        name: 'decision',
        label: 'The decision',
        type: 'text',
        required: true,
        placeholder: 'e.g. which database to use for the new service',
      },
      { name: 'options', label: 'Options', type: 'textarea', required: true, placeholder: 'One per line' },
      {
        name: 'criteria',
        label: 'Criteria',
        type: 'textarea',
        required: true,
        placeholder: 'One per line, most important first',
      },
      {
        name: 'constraints',
        label: 'Hard constraints',
        type: 'text',
        placeholder: 'Optional, e.g. budget under $500/month',
      },
    ],
  },
  {
    id: 'blog-outline',
    name: 'Article outline',
    description: 'A structured outline with a thesis, section goals and the evidence each section needs.',
    category: 'writing',
    tags: ['blog', 'outline'],
    system: 'You are an editor who cares about argument and structure more than word count.',
    prompt: `Outline an article about {{topic}} for {{audience}}.

Tone: {{tone}}. Target length: about {{word_count}} words.
{{#if angle}}
The angle: {{angle}}
{{/if}}
{{#if must_include}}
It must cover: {{must_include}}
{{/if}}

Give a working title, a one-sentence thesis, then each section as a heading with two or three bullets on what it argues and what evidence or example it needs. End with the single idea a reader should leave with.`,
    variables: [
      { name: 'topic', label: 'Topic', type: 'text', required: true },
      { name: 'audience', label: 'Audience', type: 'text', defaultValue: 'developers who are new to the topic' },
      { name: 'tone', label: 'Tone', type: 'select', options: TONES, defaultValue: 'Direct' },
      {
        name: 'word_count',
        label: 'Length (words)',
        type: 'number',
        min: 300,
        max: 5000,
        step: 100,
        defaultValue: 1200,
      },
      { name: 'angle', label: 'Angle', type: 'text', placeholder: 'Optional: what makes this take different' },
      { name: 'must_include', label: 'Must include', type: 'text', placeholder: 'Optional' },
    ],
  },
  {
    id: 'rewrite-clarity',
    name: 'Rewrite for clarity',
    description: 'Tighten a draft without changing what it says, and show what changed.',
    category: 'writing',
    tags: ['editing'],
    system: '',
    prompt: `Rewrite the text below to be clearer and more concise for {{audience}}. Keep every claim and its meaning; do not add new information.

<text>
{{text}}
</text>

Tone: {{tone}}.
{{#if keep_length}}
Keep roughly the original length; improve clarity rather than cutting.
{{/if}}

Return the rewritten text first. Then list the three most significant changes and why each helps.`,
    variables: [
      { name: 'text', label: 'Text', type: 'textarea', required: true },
      { name: 'audience', label: 'Audience', type: 'text', defaultValue: 'a general professional audience' },
      { name: 'tone', label: 'Tone', type: 'select', options: TONES, defaultValue: 'Neutral' },
      { name: 'keep_length', label: 'Keep the length', type: 'boolean', defaultValue: false },
    ],
  },
  {
    id: 'brainstorm',
    name: 'Brainstorm ideas',
    description: 'A wide first pass, then the ideas sorted by how cheap they are to test.',
    category: 'creative',
    tags: ['ideation'],
    system: '',
    prompt: `Brainstorm {{count}} ideas for: {{goal}}
{{#if constraints}}

Constraints: {{constraints}}
{{/if}}
{{#if avoid}}

Avoid anything like: {{avoid}}
{{/if}}

Make the ideas genuinely different from each other — vary the mechanism, not just the wording. Include at least two that seem unconventional. Give each a name and one sentence. Then pick the three that would be cheapest to test and describe the smallest experiment for each.`,
    variables: [
      {
        name: 'goal',
        label: 'Goal',
        type: 'text',
        required: true,
        placeholder: 'e.g. ways to get more people to read our docs',
      },
      { name: 'count', label: 'How many ideas', type: 'number', min: 5, max: 30, step: 1, defaultValue: 12 },
      { name: 'constraints', label: 'Constraints', type: 'text', placeholder: 'Optional' },
      { name: 'avoid', label: 'Avoid', type: 'text', placeholder: 'Optional: ideas already tried' },
    ],
  },
  {
    id: 'short-story',
    name: 'Short story',
    description: 'Fiction with a defined premise, voice and length, and an instruction to avoid the obvious ending.',
    category: 'creative',
    tags: ['fiction'],
    system: 'You are a literary fiction writer. You prefer specific detail to adjectives, and subtext to explanation.',
    prompt: `Write a short story of about {{word_count}} words.

Premise: {{premise}}
Genre: {{genre}}
Point of view: {{pov}}
{{#if setting}}
Setting: {{setting}}
{{/if}}

Open in the middle of a scene. Avoid the most predictable ending for this premise.`,
    variables: [
      { name: 'premise', label: 'Premise', type: 'textarea', required: true },
      {
        name: 'genre',
        label: 'Genre',
        type: 'select',
        options: ['Literary', 'Science fiction', 'Mystery', 'Fantasy', 'Horror', 'Comedy'],
        defaultValue: 'Literary',
      },
      {
        name: 'pov',
        label: 'Point of view',
        type: 'select',
        options: ['first person', 'close third person', 'second person'],
        defaultValue: 'close third person',
      },
      { name: 'setting', label: 'Setting', type: 'text', placeholder: 'Optional' },
      {
        name: 'word_count',
        label: 'Length (words)',
        type: 'number',
        min: 200,
        max: 3000,
        step: 100,
        defaultValue: 800,
      },
    ],
  },
  {
    id: 'professional-email',
    name: 'Professional email',
    description: 'An email with one clear ask, written for a specific recipient and relationship.',
    category: 'business',
    tags: ['email', 'communication'],
    system: '',
    prompt: `Write an email to {{recipient}}.

Purpose: {{purpose}}
{{#if key_points}}

Points to cover:
{{key_points}}
{{/if}}

Tone: {{tone}}.
Keep it under {{max_words}} words. Put the ask or the main point in the first two sentences, and end with a single, specific next step. Include a subject line.`,
    variables: [
      {
        name: 'recipient',
        label: 'Recipient',
        type: 'text',
        required: true,
        placeholder: 'e.g. a hiring manager I met once at a conference',
      },
      { name: 'purpose', label: 'Purpose', type: 'text', required: true },
      { name: 'key_points', label: 'Points to cover', type: 'textarea', placeholder: 'Optional, one per line' },
      { name: 'tone', label: 'Tone', type: 'select', options: TONES, defaultValue: 'Friendly' },
      { name: 'max_words', label: 'Maximum words', type: 'number', min: 50, max: 500, step: 25, defaultValue: 150 },
    ],
  },
  {
    id: 'meeting-actions',
    name: 'Meeting notes → actions',
    description: 'Turn a messy transcript into decisions, owners and open questions.',
    category: 'business',
    tags: ['meetings', 'notes'],
    system:
      'You extract structure from messy notes. You never invent an owner or a deadline that is not in the source.',
    prompt: `Here are notes from a meeting{{#if meeting_topic}} about {{meeting_topic}}{{/if}}:

<notes>
{{notes}}
</notes>

Extract:
1. Decisions made
2. Action items, each with owner and deadline if stated (write "unassigned" or "no date" otherwise)
3. Open questions nobody answered

Use a heading for each section and keep each item to one line.`,
    variables: [
      { name: 'meeting_topic', label: 'Meeting topic', type: 'text', placeholder: 'Optional' },
      { name: 'notes', label: 'Notes or transcript', type: 'textarea', required: true },
    ],
  },
  {
    id: 'job-description',
    name: 'Job description',
    description: 'A posting that describes the work honestly and separates requirements from nice-to-haves.',
    category: 'business',
    tags: ['hiring'],
    system: '',
    prompt: `Write a job description for a {{level}} {{role}} at {{company}}.

What the person will actually work on:
<work>
{{work}}
</work>

Requirements: {{requirements}}
{{#if nice_to_have}}
Nice to have: {{nice_to_have}}
{{/if}}
{{#if remote}}
The role is fully remote.
{{/if}}

Lead with the work, not the company. Keep requirements to what is genuinely required, and avoid jargon like "rockstar" or "fast-paced environment".`,
    variables: [
      { name: 'role', label: 'Role', type: 'text', required: true, placeholder: 'e.g. backend engineer' },
      {
        name: 'level',
        label: 'Level',
        type: 'select',
        options: ['junior', 'intermediate', 'senior', 'staff'],
        defaultValue: 'intermediate',
      },
      { name: 'company', label: 'Company', type: 'text', required: true },
      { name: 'work', label: 'The work', type: 'textarea', required: true },
      { name: 'requirements', label: 'Requirements', type: 'text', required: true },
      { name: 'nice_to_have', label: 'Nice to have', type: 'text', placeholder: 'Optional' },
      { name: 'remote', label: 'Fully remote', type: 'boolean', defaultValue: false },
    ],
  },
];

export const BLANK_TEMPLATE: PromptTemplate = {
  id: 'blank',
  name: 'Untitled prompt',
  description: 'Start from an empty template.',
  category: 'writing',
  tags: [],
  system: '',
  prompt: '',
  variables: [],
};

const byId = new Map(TEMPLATES.map((t) => [t.id, t]));

export function getTemplate(id: string): PromptTemplate | undefined {
  return id === BLANK_TEMPLATE.id ? BLANK_TEMPLATE : byId.get(id);
}

export function templateToDocument(template: PromptTemplate): PromptDocument {
  return {
    name: template.name,
    category: template.category,
    ...(template.id === BLANK_TEMPLATE.id ? {} : { templateId: template.id }),
    system: template.system,
    prompt: template.prompt,
    variables: template.variables.map((v) => ({ ...v })),
    values: defaultValues(template.variables),
  };
}

export const DEFAULT_TEMPLATE_ID = 'code-review';
