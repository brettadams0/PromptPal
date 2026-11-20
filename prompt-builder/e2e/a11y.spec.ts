import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PAGES = ['/', '/builder?template=code-review', '/templates', '/library'];

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`${colorScheme} theme`, () => {
    test.use({ colorScheme });

    for (const path of PAGES) {
      test(`${path} has no WCAG A/AA violations`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
        expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual(
          [],
        );
      });
    }
  });
}

test('the mobile header has a named, keyboard-accessible home link', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/templates');

  const home = page.getByRole('banner').getByRole('link', { name: 'PromptPal', exact: true });
  await expect(home).toHaveAttribute('href', '/');
  await page.getByRole('link', { name: 'Skip to content' }).focus();
  await page.keyboard.press('Tab');
  await expect(home).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/');
});
