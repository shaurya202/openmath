import { test, expect } from '@playwright/test';
import { GraderPage } from './pages/GraderPage';

test.describe('OpenMath FRQ Grader', () => {
  let graderPage: GraderPage;

  test.beforeEach(async ({ page }) => {
    graderPage = new GraderPage(page);
    await graderPage.goto();
  });

  test('should display problem statement and solution inputs', async () => {
    await expect(graderPage.problemInput).toBeVisible();
    await expect(graderPage.solutionInput).toBeVisible();
    await expect(graderPage.gradeButton).toBeVisible();
  });

  test('should evaluate FRQ solution and display rubric scorecard', async ({ page }) => {
    await graderPage.submitForGrading();

    // Verify scorecard output
    await expect(page.getByText('Evaluation Scorecard')).toBeVisible();
    await expect(page.getByText('Rubric criterion breakdown')).toBeVisible();
    await expect(page.getByText(/Conceptual Setup & Formula Selection/i)).toBeVisible();
    await expect(page.getByText(/Tutor Notes:/i)).toBeVisible();
  });
});
