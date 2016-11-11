import Key = protractor.Key;
import EC = protractor.ExpectedConditions;
import { anyTextToBePresentInElement, defaultTimeout } from '../../util/expectation';
import ElementFinder = protractor.ElementFinder;

export class Modal {

  element: ElementFinder;
  title: ElementFinder;
  body: ElementFinder;

  confirmButton: ElementFinder;

  constructor(modalClass: string) {
    this.element = element(by.css(modalClass ? `.modal-dialog .${modalClass}`: '.modal:first-child'));
    this.title = this.element.$('modal-title');
    this.element.$('modal-body');
    this.confirmButton = this.element.$('.modal-footer button.confirm');
    browser.wait(anyTextToBePresentInElement(this.title), defaultTimeout);
  }

  close() {
    browser.actions().sendKeys(Key.ESCAPE).perform();
    browser.wait(EC.not(EC.presenceOf(this.element)), defaultTimeout);
  }

  confirm() {
    browser.wait(EC.elementToBeClickable(this.confirmButton), defaultTimeout);
    this.confirmButton.click();
    browser.wait(EC.not(EC.presenceOf(this.element)), defaultTimeout);
  }

  isClosed() {
    return this.element.isPresent().then(x => !x);
  }
}
