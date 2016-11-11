import ElementFinder = protractor.ElementFinder;
import EC = protractor.ExpectedConditions;
import { defaultTimeout } from '../../../util/expectation';

export class SubmitButton {

  constructor(private element: ElementFinder) {
  }

  submit() {
    browser.wait(protractor.ExpectedConditions.elementToBeClickable(this.element), defaultTimeout);
    this.element.click();
    browser.wait(EC.invisibilityOf(this.element), defaultTimeout);
  }

  isVisible() {
    return this.element.isDisplayed();
  }
}
