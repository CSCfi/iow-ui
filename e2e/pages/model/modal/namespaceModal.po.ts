import { SearchModal } from '../../common/searchModal.po';
import { AddEditNamespaceModal } from './addEditNamespaceModal.po';

export class NamespaceModal extends SearchModal {

  createNewNamespaceButton = this.element.$('modal-body button.pull-right');

  constructor() {
    super('search-namespace');
  }

  createNewNamespace() {
    this.createNewNamespaceButton.click();
    return new AddEditNamespaceModal();
  }
}
