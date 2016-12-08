import { ModelPanelView } from './modelPanelView.po';
import { VocabularyModal } from './modal/vocabularyModal.po';

export class VocabulariesView extends ModelPanelView<VocabularyModal> {

  static TUHA = 'Tutkimushallinnon sanasto';

  constructor() {
    super('vocabularies-view', VocabularyModal);
  }

  getRowByName(name: string) {
    return this.table.getRowByColumnText('Sanaston nimi', name);
  }
}
