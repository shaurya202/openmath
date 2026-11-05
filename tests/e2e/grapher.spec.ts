import { test, expect } from '@playwright/test';
import { GrapherPage } from './pages/GrapherPage';

test.describe('OpenMath Interactive Grapher', () => {
  let grapherPage: GrapherPage;

  test.beforeEach(async ({ page }) => {
    grapherPage = new GrapherPage(page);
    await grapherPage.goto();
  });

  test('should render grapher canvas and default functions', async ({ page }) => {
    await expect(page).toHaveTitle(/OpenMath/i);
    await expect(grapherPage.functionInput).toBeVisible();
    await expect(grapherPage.plotButton).toBeVisible();
    await expect(page.locator('canvas').first()).toBeVisible();

    const initialCount = await grapherPage.getPlottedCount();
    expect(initialCount).toBeGreaterThanOrEqual(2);
  });

  test('should add new function to plotted list', async ({ page }) => {
    const initialCount = await grapherPage.getPlottedCount();
    await grapherPage.plotFunction('sin(x) * 2');

    await expect(page.getByText('f_3(x) = sin(x) * 2')).toBeVisible();
    const newCount = await grapherPage.getPlottedCount();
    expect(newCount).toBe(initialCount + 1);
  });

  test('should delete function from plotted list', async () => {
    const initialCount = await grapherPage.getPlottedCount();
    await grapherPage.deleteFirstFunction();
    const newCount = await grapherPage.getPlottedCount();
    expect(newCount).toBe(initialCount - 1);
  });
});
