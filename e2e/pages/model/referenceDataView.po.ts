import { ModelPanelView } from './modelPanelView.po';
import { ReferenceDataModal } from './modal/referenceDataModal.po';

export class ReferenceDataView extends ModelPanelView<ReferenceDataModal> {
  constructor() {
    super('reference-datas-view', ReferenceDataModal);
  }
}
