import { expect, test, type Page } from '@playwright/test';

const preview = (page: Page) => page.getByTestId('preview-prompt');
const checks = (page: Page) => page.getByRole('region', { name: 'Checks' });

test('opens a template from the library and fills it in', async ({ page }) => {
  await page.goto('/templates');
  await page.getByRole('searchbox', { name: 'Search templates' }).fill('review');
  await page.getByRole('link', { name: /Code review/ }).click();

  await expect(page).toHaveURL(/\/builder\?template=code-review/);
  await expect(page.getByLabel('Prompt name')).toHaveValue('Code review');
  await expect(checks(page)).toContainText('“Code” is required.');

  await page.getByRole('textbox', { name: 'Code', exact: true }).fill('function add(a, b) { return a - b; }');
  await expect(preview(page)).toContainText('return a - b;');
  await expect(page.getByTestId('lint-ok')).toBeVisible();

  // Optional sections appear only when their field is filled in.
  await expect(preview(page)).not.toContainText('<context>');
  await page.getByLabel('Context').fill('Adds two numbers');
  await expect(preview(page)).toContainText('<context>');
});

test('exports a runnable API call', async ({ page }) => {
  await page.goto('/builder?template=meeting-actions');
  await page.getByLabel('Notes or transcript').fill('Sam will ship the fix by Friday. Do we need a postmortem?');
  await page.getByRole('tab', { name: 'Export' }).click();

  await page.getByRole('button', { name: 'cURL' }).click();
  const output = page.getByTestId('export-output');
  await expect(output).toContainText('anthropic-version: 2023-06-01');
  await expect(output).toContainText('"model": "claude-opus-5-5"');

  await page.getByRole('combobox', { name: 'Model' }).click();
  await page.getByRole('option', { name: 'Claude Haiku 5.5' }).click();
  await expect(output).toContainText('"model": "claude-haiku-5-5"');

  await page.getByRole('button', { name: 'API JSON' }).click();
  const body = JSON.parse((await output.textContent()) ?? '');
  expect(body.messages[0].content).toContain('Sam will ship the fix by Friday.');
});

test('infers fields from the template and points at syntax errors', async ({ page }) => {
  await page.goto('/builder?template=blank');
  const source = page.getByLabel('Prompt', { exact: true });
  await source.fill('Write a haiku about {{subject}}.\n{{#if seasonal}}\nMention the season.');

  await expect(checks(page)).toContainText('Prompt line 2, column 1');
  await checks(page)
    .getByRole('button', { name: /never closed/ })
    .click();
  await expect(source).toBeFocused();
  expect(await source.evaluate((el: HTMLTextAreaElement) => el.value.slice(el.selectionStart, el.selectionEnd))).toBe(
    '{{#if seasonal}}',
  );

  await source.press('End');
  await source.pressSequentially('\n{{/if}}');
  await page.getByRole('tab', { name: 'Fill in' }).click();
  await page.getByLabel('Subject').fill('the sea');
  await page.getByLabel('Seasonal').check();
  await expect(preview(page)).toHaveText('Write a haiku about the sea.\nMention the season.');
});

test('round-trips a prompt through a share link', async ({ page, context }) => {
  await page.goto('/builder?template=brainstorm');
  await page.getByLabel('Goal', { exact: true }).fill('names for a hedgehog café');
  await page.getByRole('button', { name: 'Share link' }).click();
  await expect(page.getByRole('button', { name: 'Link copied' })).toBeVisible();

  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toMatch(/\/builder#p=[\w-]+$/);

  const other = await context.newPage();
  await other.goto(link);
  await expect(other.getByLabel('Goal', { exact: true })).toHaveValue('names for a hedgehog café');
  await expect(other.getByRole('status')).toContainText('Opened from a shared link');
  // The fragment is dropped once loaded, so it cannot go stale.
  await expect(other).toHaveURL(/\/builder$/);
});

test('reports a corrupted share link instead of failing silently', async ({ page }) => {
  await page.goto('/builder#p=not-a-real-link');
  await expect(page.getByRole('alert').filter({ hasText: 'Couldn’t open that link' })).toBeVisible();
});

test('saves to the library and reopens', async ({ page }) => {
  await page.goto('/builder?template=professional-email');
  await page.getByLabel('Prompt name').fill('Thank-you note');
  await page.getByLabel('Recipient').fill('my mentor');
  await page.getByLabel('Purpose').fill('say thanks for the referral');
  await page.keyboard.press('Control+s');
  await expect(page.getByRole('button', { name: 'Saved' })).toBeDisabled();

  await page.getByRole('link', { name: 'Saved' }).click();
  await expect(page.getByText('Thank-you note')).toBeVisible();
  await page.getByRole('link', { name: 'Open' }).click();
  await expect(page.getByLabel('Recipient')).toHaveValue('my mentor');

  await page.goto('/library');
  await page.getByRole('button', { name: 'Delete Thank-you note' }).click();
  await expect(page.getByText('Nothing saved yet')).toBeVisible();
});
