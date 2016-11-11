import { Modal } from '../../common/modal.po';
import { EditableComponent } from '../../common/component/editableComponent.po';

export class AddEditNamespaceModal extends Modal {

  label = EditableComponent.byTitleLocalizationKey(this.element, 'Namespace label');
  namespace = EditableComponent.byTitleLocalizationKey(this.element, 'Namespace');
  prefix = EditableComponent.byTitleLocalizationKey(this.element, 'Prefix');

  constructor() {
    super('add-edit-namespace');
  }
}
