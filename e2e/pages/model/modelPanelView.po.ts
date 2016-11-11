import { Modal } from '../common/modal.po';
import { EditableTable } from '../common/component/editableTable.po';
import EC = protractor.ExpectedConditions;
import { defaultTimeout } from '../../util/expectation';

export class ModelPanelView<M extends Modal> {

  element = element(by.css(this.elementName));
  addNewButton = this.element.element(by.partialButtonText('Lisää'));
  table = new EditableTable(this.element);

  constructor(private elementName: string, private modalConstructor: { new(): M }) {
  }

  addNew() {
    browser.wait(EC.visibilityOf(this.addNewButton), defaultTimeout);
    this.addNewButton.click();
    return new this.modalConstructor();
  }
}
