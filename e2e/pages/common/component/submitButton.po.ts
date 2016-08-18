import ElementFinder = protractor.ElementFinder;

export class SubmitButton {

  constructor(private element: ElementFinder) {
  }

  submit() {
    browser.wait(protractor.ExpectedConditions.elementToBeClickable(this.element), 1000).then(() => {
      this.element.click();
    });
  }

  isVisible() {
    return this.element.isDisplayed();
  }
}
