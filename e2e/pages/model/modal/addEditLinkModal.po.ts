import { Modal } from '../../common/modal.po';
import { EditableComponent } from '../../common/component/editableComponent.po';

export class AddEditLinkModal extends Modal {

  homepage = EditableComponent.byTitleLocalizationKey(this.element, 'Homepage');
  label = EditableComponent.byTitleLocalizationKey(this.element, 'Title');
  description = EditableComponent.byTitleLocalizationKey(this.element, 'Description');

  constructor() {
    super('add-edit-link');
  }

  confirm() {
    this.element.$('modal-buttons button.confirm').click();
  }
}
