import Key = protractor.Key;

export class Modal {

  element = element(by.css('.modal:first-child'));
  title = this.element.$('modal-title');
  body = this.element.$('modal-body');

  constructor() {
    browser.wait(protractor.ExpectedConditions.presenceOf(this.body.$$('*').first()));
  }

  close() {
    browser.actions().sendKeys(Key.ESCAPE).perform();
  }

  isClosed() {
    return this.element.isPresent().then(x => !x);
  }
}
