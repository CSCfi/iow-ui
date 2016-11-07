import Key = protractor.Key;
import EC = protractor.ExpectedConditions;
import { anyTextToBePresentInElement } from '../../util/expectation';

export class Modal {

  element = element(by.css('.modal:first-child'));
  title = this.element.$('modal-title');
  body = this.element.$('modal-body');

  constructor() {
    browser.wait(anyTextToBePresentInElement(this.title));
  }

  close() {
    browser.actions().sendKeys(Key.ESCAPE).perform();
    browser.wait(EC.not(EC.presenceOf(this.element)));
  }

  isClosed() {
    return this.element.isPresent().then(x => !x);
  }
}
