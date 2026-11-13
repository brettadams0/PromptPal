import type { PromptDocument, Values } from './schema';

/**
 * One realistic value for every required field of each built-in template, so a
 * first-time visitor can see a finished prompt and a clean "Ready" in one click.
 * examples.test.ts holds this to the templates: every required field has a
 * value, no value is a field the template doesn't declare, and the result lints
 * clean (so none of these may contain fill-me-in text).
 */
export const EXAMPLES: Readonly<Record<string, Values>> = {
  'code-review': {
    code: `function average(nums: number[]): number {
  let sum = 0;
  for (let i = 0; i <= nums.length; i++) {
    sum += nums[i];
  }
  return sum / nums.length;
}`,
  },
  'debug-error': {
    error: `TypeError: Cannot read properties of undefined (reading 'map')
    at renderList (src/list.ts:14:22)
    at App (src/app.ts:31:5)`,
  },
  'unit-tests': {
    code: `export function slugify(title: string): string {
  return title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}`,
  },
  'summarize-document': {
    document:
      'On Tuesday the checkout service returned errors for 23 minutes after a configuration change doubled the database connection pool. The database ran out of connections, requests queued, and the load balancer marked healthy instances as down. We rolled the change back at 14:12 and added a limit check to the deploy pipeline.',
  },
  'decision-matrix': {
    decision: 'Which database should we use for the new analytics service?',
    options: 'PostgreSQL\nClickHouse\nBigQuery',
    criteria: 'Query speed on large scans\nOperating cost\nTeam familiarity',
  },
  'blog-outline': { topic: 'How database indexes speed up queries' },
  'rewrite-clarity': {
    text: 'Due to the fact that the deployment was not able to be completed in a timely manner, the team made the decision to postpone the release until such time as the issues have been resolved.',
  },
  brainstorm: { goal: 'Name a command-line tool that checks configuration files for mistakes' },
  'short-story': {
    premise: 'A lighthouse keeper discovers that the light has been guiding ships that no longer exist.',
  },
  'professional-email': {
    recipient: 'My manager',
    purpose: 'Ask for feedback on my project plan before Friday',
  },
  'meeting-actions': {
    notes:
      'Priya: the API migration is on track, but staging is still blocked. Marcus will ask infrastructure to unblock staging by Wednesday. Priya will write the rollback plan by Thursday. We agreed to review the plan on Friday.',
  },
  'job-description': {
    role: 'Backend engineer',
    company: 'Northwind Logistics',
    work: 'Build and run the services that route and track shipments, from API design to being on call.',
    requirements: '3+ years building backend services, comfortable with SQL',
  },
};

/** The example for the template this document came from, if it has one. */
export function exampleFor(doc: PromptDocument): Values | undefined {
  return doc.templateId ? EXAMPLES[doc.templateId] : undefined;
}
