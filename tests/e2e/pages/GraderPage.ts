import { Page, Locator } from '@playwright/test';

export class GraderPage {
  readonly page: Page;
  readonly problemInput: Locator;
  readonly solutionInput: Locator;
  readonly gradeButton: Locator;
  readonly scorecard: Locator;
  readonly rubricBreakdown: Locator;

  constructor(page: Page) {
    this.page = page;
    this.problemInput = page.getByRole('textbox', { name: 'Problem statement' });
    this.solutionInput = page.getByRole('textbox', { name: 'Solution to evaluate' });
    this.gradeButton = page.getByRole('button', { name: 'Grade Submission' });
    this.scorecard = page.locator('text=Evaluation Scorecard').locator('..');
    this.rubricBreakdown = page.locator('text=Rubric criterion breakdown').locator('..');
  }

  async goto() {
    await this.page.goto('/grader');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async submitForGrading(problem?: string, solution?: string) {
    if (problem) {
      await this.problemInput.fill(problem);
    }
    if (solution) {
      await this.solutionInput.fill(solution);
    }
    await this.gradeButton.click();
  }
}
