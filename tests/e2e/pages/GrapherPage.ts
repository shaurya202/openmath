import { Page, Locator } from '@playwright/test';

export class GrapherPage {
  readonly page: Page;
  readonly functionInput: Locator;
  readonly plotButton: Locator;
  readonly zoomInButton: Locator;
  readonly zoomOutButton: Locator;
  readonly resetViewButton: Locator;
  readonly plottedList: Locator;
  readonly deleteButtons: Locator;

  constructor(page: Page) {
    this.page = page;
    this.functionInput = page.getByPlaceholder(/e\.g\. x\^2/i);
    this.plotButton = page.getByRole('button', { name: 'Plot' });
    this.zoomInButton = page.getByRole('button', { name: 'Zoom In' });
    this.zoomOutButton = page.getByRole('button', { name: 'Zoom Out' });
    this.resetViewButton = page.getByRole('button', { name: 'Reset View' });
    this.plottedList = page.locator('text=Plotted Functions').locator('..');
    this.deleteButtons = page.getByRole('button', { name: 'Delete' });
  }

  async goto() {
    await this.page.goto('/grapher');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async plotFunction(expr: string) {
    await this.functionInput.fill(expr);
    await this.plotButton.click();
  }

  async getPlottedCount(): Promise<number> {
    return await this.deleteButtons.count();
  }

  async deleteFirstFunction() {
    await this.deleteButtons.first().click();
  }
}
