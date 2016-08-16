import { Modal } from '../common/modal.po';

export class ModelPanelView<M extends Modal> {

  element = element(by.css('vocabularies-view'));
  addNewButton = this.element.element(by.partialButtonText('Lisää'));
  table = this.element.$('table');

  constructor(elementName: string, private modalConstructor: { new(): M }) {
    this.element = element(by.css(elementName));
  }

  addNew() {
    this.addNewButton.click();
    return new this.modalConstructor();
  }

  containsColumn(value: string) {
    return this.table.element(by.cssContainingText('td', value)).isPresent();
  }
}
