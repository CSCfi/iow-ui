import { Modal } from './modal.po';
import { SubmitButton } from './component/submitButton.po';
import EC = protractor.ExpectedConditions;
import { defaultTimeout } from '../../util/expectation';

export class SearchModal extends Modal {

  searchElement = this.element.element(by.model('ctrl.searchText'));
  searchResults = this.element.$('.search-results');
  loadingIndicator = this.searchResults.$('ajax-loading-indicator');
  confirmButton = new SubmitButton(this.element.$('modal-buttons button.confirm'));

  constructor(modalClass: string) {
    super(modalClass);
  }

  search(text: string, clear = false) {
    return browser.wait(protractor.ExpectedConditions.stalenessOf(this.loadingIndicator), defaultTimeout).then(() => {
      if (clear) {
        this.searchElement.clear();
      }
      return this.searchElement.sendKeys(text);
    });
  }

  findResultElementByName(name: string) {
    this.waitForResults();
    return this.searchResults.element(by.cssContainingText('h5', name));
  }

  findResultElementById(id: string) {
    this.waitForResults();
    return this.searchResults.element(by.id(id));
  }

  findAddNewResultElementByIndex(index: number) {
    this.waitForResults();
    return this.searchResults.all(by.css(`.search-result.add-new`)).get(index);
  }

  selectResultByName(name: string) {
    return browser.wait(protractor.until.elementLocated(by.css('search-results')), defaultTimeout)
      .then(() => this.findResultElementByName(name).click());
  }

  selectResultById(id: string) {
    return browser.wait(protractor.until.elementLocated(by.css('search-results')), defaultTimeout)
      .then(() => this.findResultElementById(id).click());
  }

  selectAddNewResultByIndex(index: number) {
    return browser.wait(protractor.until.elementLocated(by.css('search-results')), defaultTimeout)
      .then(() => this.findAddNewResultElementByIndex(index).click());
  }

  confirm() {
    this.confirmButton.submit();
    browser.wait(EC.not(EC.presenceOf(this.element)), defaultTimeout);
  }

  private waitForResults() {
    browser.wait(EC.presenceOf(this.searchResults.$('.search-result')), defaultTimeout);
  }
}
