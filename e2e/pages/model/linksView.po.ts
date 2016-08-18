import { ModelPanelView } from './modelPanelView.po';
import { AddEditLinkModal } from './modal/addEditLinkModal.po';

export class LinksView extends ModelPanelView<AddEditLinkModal> {

  static nameColumn = 'Nimi';

  constructor() {
    super('links-view', AddEditLinkModal);
  }

  getRowByName(name: string) {
    return this.table.getRowByColumnText(LinksView.nameColumn, name);
  }

  editRowByName(name: string) {
    this.table.getRowByColumnText(LinksView.nameColumn, name).edit();
    return new AddEditLinkModal();
  }

  removeRowByName(name: string) {
    this.table.getRowByColumnText(LinksView.nameColumn, name).remove();
  }
}
