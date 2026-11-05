import { Page, Locator } from '@playwright/test';

export class StudyPage {
  readonly page: Page;
  readonly flashcardsTab: Locator;
  readonly practiceExamTab: Locator;
  readonly flashcard: Locator;
  readonly flipIndicator: Locator;
  readonly nextCardButton: Locator;
  readonly prevCardButton: Locator;
  readonly cardCounter: Locator;
  readonly againButton: Locator;
  readonly goodButton: Locator;
  readonly easyButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.flashcardsTab = page.getByRole('button', { name: 'Flashcards' });
    this.practiceExamTab = page.getByRole('button', { name: 'Practice exam' });
    this.flashcard = page.locator('text=Click to flip').locator('..');
    this.flipIndicator = page.locator('text=Click to flip');
    this.nextCardButton = page.getByRole('button', { name: 'Next', exact: true });
    this.prevCardButton = page.getByRole('button', { name: 'Previous', exact: true });
    this.cardCounter = page.locator('text=/Card \\d+ of \\d+/');
    this.againButton = page.getByRole('button', { name: /Again/i });
    this.goodButton = page.getByRole('button', { name: /Good/i });
    this.easyButton = page.getByRole('button', { name: /Easy/i });
  }

  async goto() {
    await this.page.goto('/study');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async flipCard() {
    await this.flashcard.click();
  }

  async rateGood() {
    await this.goodButton.click();
  }

  async switchToPracticeExam() {
    await this.practiceExamTab.click();
  }
}
