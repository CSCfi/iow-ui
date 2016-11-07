import { SearchModal } from '../../common/searchModal.po';
import { EditableComponent } from '../../common/component/editableComponent.po';
import { Uri } from '../../../../src/entities/uri';

export class SearchConceptModal extends SearchModal {

  vocabulary = EditableComponent.byTitleLocalizationKey(this.element, 'Vocabulary');
  label = EditableComponent.byTitleLocalizationKey(this.element, 'Concept label');
  definition = EditableComponent.byTitleLocalizationKey(this.element, 'Definition');

  constructor() {
    super('search-concept');
  }

  suggestNewConcept() {
    this.searchElement.getAttribute('value').then(search => {
      this.search(' ' + Uri.randomUUID().toString()); // XXX: use unique names so that suggest creation always works
      this.selectAddNewResultByIndex(0);
      this.label.setValue(search.toLowerCase());
    });
  }
}

