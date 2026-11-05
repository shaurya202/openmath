import { Page, Locator } from '@playwright/test';

export class SolverPage {
  readonly page: Page;
  readonly expressionInput: Locator;
  readonly solveButton: Locator;
  readonly clearButton: Locator;
  readonly virtualKeyboardButton: Locator;
  readonly calculatorButton: Locator;
  readonly themeToggle: Locator;
  readonly exampleButtons: Locator;
  readonly virtualKeyboard: Locator;
  readonly calculatorDrawer: Locator;
  readonly recentCalculations: Locator;

  constructor(page: Page) {
    this.page = page;
    this.expressionInput = page.getByPlaceholder(/Enter an equation or expression/i);
    this.solveButton = page.getByRole('button', { name: /Solve math problem/i });
    this.clearButton = page.getByRole('button', { name: 'Clear' });
    this.virtualKeyboardButton = page.getByRole('button', { name: /Toggle virtual math keyboard/i });
    this.calculatorButton = page.getByRole('button', { name: /Toggle Calculator/i });
    this.themeToggle = page.getByRole('button', { name: /Toggle theme/i });
    this.exampleButtons = page.locator('button:has-text("Polynomial Equation"), button:has-text("Trigonometric Limit")');
    this.virtualKeyboard = page.locator('text=Close Keyboard').locator('..').locator('..');
    this.calculatorDrawer = page.locator('text=Scientific Calculator').locator('..');
    this.recentCalculations = page.locator('text=Recent calculations').locator('..');
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async selectExample(name: string) {
    await this.page.getByRole('button', { name: new RegExp(name, 'i') }).click();
  }

  async setExpression(expr: string) {
    await this.expressionInput.fill(expr);
  }

  async submitSolve() {
    await this.solveButton.click();
  }

  async toggleVirtualKeyboard() {
    await this.virtualKeyboardButton.click();
  }

  async toggleCalculator() {
    await this.calculatorButton.click();
  }

  async toggleTheme() {
    await this.themeToggle.click();
  }
}
