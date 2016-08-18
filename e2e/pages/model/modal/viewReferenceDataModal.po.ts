import { Modal } from '../../common/modal.po';
import { NonEditableComponent } from '../../common/component/nonEditableComponent.po';

export class ViewReferenceDataModal extends Modal {

  label = NonEditableComponent.byTitleLocalizationKey('Reference data name');
}
