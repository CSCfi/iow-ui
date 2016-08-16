import { Modal } from '../modal.po';

export class ConfirmationModal extends Modal {

  confirmationButton = this.element.element(by.buttonText('Kyllä'));
  cancelButton = this.element.element(by.buttonText('Peruuta'));

  confirm() {
    this.confirmationButton.click();
  }

  cancel() {
    this.cancelButton.click();
  }
}
