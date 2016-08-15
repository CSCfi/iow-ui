import { ElementFinder } from 'protractor';
import { ConfirmationModal } from '../modal/confirmationModal.po';

export class EditableEntityButtons {

  element: ElementFinder;
  cancelButton: ElementFinder;
  saveButton: ElementFinder;
  editButton: ElementFinder;
  removeButton: ElementFinder;

  constructor(context: ElementFinder) {
    this.element = context.$('editable-entity-buttons');
    this.cancelButton = this.element.$('button.cancel');
    this.saveButton = this.element.$('button.save');
    this.editButton = this.element.$('button.edit');
    this.removeButton = this.element.$('button.remove');
  }

  isEditing() {
    return this.saveButton.isDisplayed();
  }

  isNotEditing() {
    return this.isEditing().then(x => !x);
  }

  canEdit() {
    return protractor.promise.all([this.editButton.isDisplayed(), this.saveButton.isDisplayed()])
      .then(([isEditable, isEditing]) => isEditable || isEditing);
  }

  save() {
    this.saveButton.click();
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
