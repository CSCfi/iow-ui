import { ElementFinder } from 'protractor';
import { ConfirmationModal } from './confirmationModal.po';
import { SubmitButton } from './submitButton.po';

export class EditableEntityButtons {

  element: ElementFinder;
  cancelButton: ElementFinder;
  saveButton: SubmitButton;
  editButton: ElementFinder;
  removeButton: ElementFinder;

  constructor(context: ElementFinder) {
    this.element = context.$('editable-entity-buttons');
    this.cancelButton = this.element.$('button.cancel');
    this.saveButton = new SubmitButton(this.element.$('button.save'));
    this.editButton = this.element.$('button.edit');
    this.removeButton = this.element.$('button.remove');
  }

  isEditing() {
    return this.saveButton.isVisible();
  }

  isNotEditing() {
    return this.isEditing().then(x => !x);
  }

  canEdit() {
    return protractor.promise.all([this.editButton.isDisplayed(), this.saveButton.isVisible()])
      .then(([isEditable, isEditing]) => isEditable || isEditing);
  }

  save() {
    return this.saveButton.submit();
  }

  cancel() {
    this.cancelButton.click();
  }

  edit() {
    this.editButton.click();
  }

  remove() {
    this.removeButton.click();
    return new ConfirmationModal();
  }

  removeAndConfirm() {
    this.remove().confirm();
  }
}
