import { test, expect } from '@playwright/test';
import { StudyPage } from './pages/StudyPage';

test.describe('OpenMath Study Suite & Spaced Repetition', () => {
  let studyPage: StudyPage;

  test.beforeEach(async ({ page }) => {
    studyPage = new StudyPage(page);
    await studyPage.goto();
  });

  test('should display flashcards and flip to reveal answer and SM-2 controls', async ({ page }) => {
    await expect(page.getByText('Formula flashcards')).toBeVisible();
    await expect(page.getByText('Card 1 of 5')).toBeVisible();
    await expect(studyPage.flipIndicator).toBeVisible();

    await studyPage.flipCard();
    await expect(page.getByText('Answer & Formula')).toBeVisible();
    await expect(studyPage.goodButton).toBeVisible();

    await studyPage.rateGood();
    await expect(page.getByText('Card 2 of 5')).toBeVisible();
  });

  test('should switch to practice exam mode and answer questions', async ({ page }) => {
    await studyPage.switchToPracticeExam();
    await expect(page.getByText('AP / College Level Diagnostic')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Question 1 of/i })).toBeVisible();

    // Select option A
    const optionA = page.getByRole('button', { name: 'A', exact: true });
    await expect(optionA).toBeVisible();
    await optionA.click();

    // Proceed to next question
    const nextButton = page.getByRole('button', { name: /Next Question/i });
    await expect(nextButton).toBeEnabled();
    await nextButton.click();
    await expect(page.getByRole('heading', { name: /Question 2 of/i })).toBeVisible();
  });
});
