import { test, expect } from '@playwright/test';
import { SolverPage } from './pages/SolverPage';

test.describe('OpenMath Solver & Core UI', () => {
  let solverPage: SolverPage;

  test.beforeEach(async ({ page }) => {
    solverPage = new SolverPage(page);
    await solverPage.goto();
  });

  test('should display landing page with brand and navigation links', async ({ page }) => {
    await expect(page).toHaveTitle(/OpenMath/i);
    await expect(solverPage.expressionInput).toBeVisible();
    await expect(solverPage.solveButton).toBeDisabled();
    await expect(page.getByRole('link', { name: 'Grapher' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Study Suite' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'AP Exam Hub' }).first()).toBeVisible();
  });

  test('should load preset math problem into input field', async () => {
    await solverPage.selectExample('Polynomial Equation');
    await expect(solverPage.expressionInput).toHaveValue(/2x\^2 \+ 5x - 3 = 0/);
    await expect(solverPage.solveButton).toBeEnabled();
  });

  test('should toggle virtual math keyboard with latex symbols', async ({ page }) => {
    await solverPage.toggleVirtualKeyboard();
    await expect(page.getByRole('button', { name: 'Close Keyboard' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'fraction' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'π' })).toBeVisible();

    await page.getByRole('button', { name: 'Close Keyboard' }).click();
    await expect(page.getByRole('button', { name: 'Close Keyboard' })).not.toBeVisible();
  });

  test('should toggle scientific calculator drawer', async ({ page }) => {
    await solverPage.toggleCalculator();
    await expect(page.getByText('Scientific Calculator').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'sin', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'AC', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Close calculator' }).first().click();
    await expect(page.getByText('Scientific Calculator').first()).not.toBeVisible();
  });

  test('should toggle dark/light theme class on html document', async ({ page }) => {
    const html = page.locator('html');
    const initialClass = await html.getAttribute('class');
    await solverPage.toggleTheme();
    const updatedClass = await html.getAttribute('class');
    expect(updatedClass).not.toBe(initialClass);
  });
});
