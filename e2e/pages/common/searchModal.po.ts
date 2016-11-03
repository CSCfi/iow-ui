import { Modal } from './modal.po';
import { SubmitButton } from './component/submitButton.po';

export class SearchModal extends Modal {

  searchElement = this.element.element(by.model('ctrl.searchText'));
  searchResults = this.element.$('.search-results');
  loadingIndicator = this.searchResults.$('ajax-loading-indicator');
  confirmButton = new SubmitButton(this.element.$('modal-buttons button.confirm'));

  search(text: string) {
    return browser.wait(protractor.ExpectedConditions.stalenessOf(this.loadingIndicator)).then(() => this.searchElement.sendKeys(text));
  }

  findResultElementByName(name: string) {
    return this.searchResults.element(by.cssContainingText('h5', name));
  }

  findResultElementById(id: string) {
    return this.searchResults.element(by.id(id));
  }

  selectResultByName(name: string) {
    return browser.wait(protractor.until.elementLocated(by.css('search-results')))
      .then(() => this.findResultElementByName(name).click());
  }

  selectResultById(id: string) {
    return browser.wait(protractor.until.elementLocated(by.css('search-results')))
      .then(() => this.findResultElementById(id).click());
  }

  confirm() {
    this.confirmButton.submit();
  }
}
