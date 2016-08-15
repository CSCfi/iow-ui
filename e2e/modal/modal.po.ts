import Key = protractor.Key;

export class Modal {

  element = element(by.css('.modal-dialog'));
  title = this.element.$('modal-title');

  constructor() {
    // TODO better check for when angular template is rendered fully
    browser.sleep(200);
  }

  close() {
    browser.actions().sendKeys(Key.ESCAPE).perform();
  }

  isClosed() {
    return this.element.isPresent().then(x => !x);
  }
}
