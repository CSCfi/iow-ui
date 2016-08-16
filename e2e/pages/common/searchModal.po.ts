import { Modal } from './modal.po';

export class SearchModal extends Modal {

  searchElement = this.element.element(by.binding('ctrl.searchText'));
  searchResults = this.element.$('.search-results');

  findResultElementByName(name: string) {
    return this.searchResults.element(by.cssContainingText('h5', name));
  }

  selectResult(name: string) {
    this.findResultElementByName(name).click();
  }
}
