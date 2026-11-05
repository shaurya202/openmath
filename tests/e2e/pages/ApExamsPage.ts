import { Page, Locator } from '@playwright/test';

export class ApExamsPage {
  readonly page: Page;
  readonly subjectTabs: Locator;
  readonly unitCards: Locator;
  readonly keyFormulasButtons: Locator;
  readonly practiceExamButtons: Locator;

  constructor(page: Page) {
    this.page = page;
    this.subjectTabs = page.locator('button:has-text("AP Calculus BC"), button:has-text("AP Calculus AB"), button:has-text("AP Statistics")');
    this.unitCards = page.locator('text=/Unit \\d+/');
    this.keyFormulasButtons = page.getByRole('button', { name: 'Key Formulas' });
    this.practiceExamButtons = page.getByRole('button', { name: 'Practice Exam' });
  }

  async goto() {
    await this.page.goto('/ap-exams');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async selectSubject(subject: string) {
    await this.page.getByRole('button', { name: subject }).click();
  }

  async openKeyFormulas(index = 0) {
    await this.keyFormulasButtons.nth(index).click();
  }
}
