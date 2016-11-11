import { Modal } from '../../common/modal.po';
import { SubmitButton } from '../../common/component/submitButton.po';
import EC = protractor.ExpectedConditions;
import { defaultTimeout } from '../../../util/expectation';

export class AddPropertiesFromClassModal extends Modal {

  confirmButton = new SubmitButton(this.element.$('modal-buttons button.confirm'));

  constructor() {
    super('add-properties-from-class');
  }

  confirm() {
    this.confirmButton.submit();
    browser.wait(EC.not(EC.presenceOf(this.element)), defaultTimeout);
  }
}
