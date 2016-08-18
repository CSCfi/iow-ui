import { Modal } from '../../common/modal.po';
import { EditableComponent } from '../../common/component/editableComponent.po';

export class AddEditNamespaceModal extends Modal {

  label = EditableComponent.byTitleLocalizationKey('Namespace label');
  namespace = EditableComponent.byTitleLocalizationKey('Namespace');
  prefix = EditableComponent.byTitleLocalizationKey('Prefix');

  confirm() {
    this.element.$('modal-buttons button.confirm').click();
  }
}
