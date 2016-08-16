import { ModelPanelView } from './modelPanelView.po';
import { VocabularyModal } from './modal/vocabularyModal.po';

export class VocabulariesView extends ModelPanelView<VocabularyModal> {

  static EOS = 'Elinikäisen oppimisen sanasto';

  constructor() {
    super('vocabularies-view', VocabularyModal);
  }
}
