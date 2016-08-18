import { ModelPanelView } from './modelPanelView.po';
import { ReferenceDataModal } from './modal/referenceDataModal.po';
import { ViewReferenceDataModal } from './modal/viewReferenceDataModal.po';

export class ReferenceDataView extends ModelPanelView<ReferenceDataModal> {

  static hakukelpoisuus = 'Hakukelpoisuus';
  static nameColumn = 'Koodiston nimi';

  constructor() {
    super('reference-datas-view', ReferenceDataModal);
  }

  getRowByName(name: string) {
    return this.table.getRowByColumnText(ReferenceDataView.nameColumn, name);
  }

  clickName(name: string) {
    this.getRowByName(name).clickCell(ReferenceDataView.nameColumn);
    return new ViewReferenceDataModal();
  }
}
