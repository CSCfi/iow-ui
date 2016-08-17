import { ModelPanelView } from './modelPanelView.po';
import { ReferenceDataModal } from './modal/referenceDataModal.po';

export class ReferenceDataView extends ModelPanelView<ReferenceDataModal> {

  static hakukelpoisuus = 'Hakukelpoisuus';

  constructor() {
    super('reference-datas-view', ReferenceDataModal);
  }

  getRowByName(name: string) {
    return this.table.getRowByColumnText('Koodiston nimi', name);
  }
}
