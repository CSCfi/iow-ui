import { ModelPanelView } from './modelPanelView.po';
import { NamespaceModal } from './modal/namespaceModal.po';

export class NamespacesView extends ModelPanelView<NamespaceModal> {
  constructor() {
    super('imported-namespaces-view', NamespaceModal);
  }
}
