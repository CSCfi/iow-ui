import { ModelPanelView } from './modelPanelView.po';
import { VocabularyModal } from './modal/vocabularyModal.po';

export class VocabulariesView extends ModelPanelView<VocabularyModal> {
  constructor() {
    super('vocabularies-view', VocabularyModal);
  }
}
