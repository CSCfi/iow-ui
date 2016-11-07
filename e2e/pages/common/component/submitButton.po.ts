import ElementFinder = protractor.ElementFinder;
import EC = protractor.ExpectedConditions;

export class SubmitButton {

  constructor(private element: ElementFinder) {
  }

  submit() {
    browser.wait(protractor.ExpectedConditions.elementToBeClickable(this.element), 1000).then(() => {
      this.element.click();
    });
    browser.wait(EC.invisibilityOf(this.element));
  }

  isVisible() {
    return this.element.isDisplayed();
  }
}
