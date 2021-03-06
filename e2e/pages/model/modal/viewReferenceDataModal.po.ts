import { Modal } from '../../common/modal.po';
import { NonEditableComponent } from '../../common/component/nonEditableComponent.po';

export class ViewReferenceDataModal extends Modal {

  label = NonEditableComponent.byTitleLocalizationKey(this.element, 'Reference data name');

  constructor() {
    super('view-reference-data');
  }
}
