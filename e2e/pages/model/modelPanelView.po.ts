import { Modal } from '../common/modal.po';

export class ModelPanelView<M extends Modal> {

  element = element(by.css('vocabularies-view'));
  addNewButton = this.element.element(by.partialButtonText('Lisää'));

  constructor(elementName: string, private modalConstructor: { new(): M }) {
    this.element = element(by.css(elementName));
  }

  addNew() {
    this.addNewButton.click();
    return new this.modalConstructor();
  }
}
