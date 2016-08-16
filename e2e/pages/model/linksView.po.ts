import { ModelPanelView } from './modelPanelView.po';
import { LinkModal } from './modal/linkModal.po';

export class LinksView extends ModelPanelView<LinkModal> {
  constructor() {
    super('links-view', LinkModal);
  }
}
