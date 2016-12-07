import { module as mod }  from './module';
import { SearchConceptModal } from './searchConceptModal';
import { Class } from '../../entities/class';
import { Predicate } from '../../entities/predicate';
import { Model } from '../../entities/model';
import { LanguageService } from '../../services/languageService';
import { isConcept } from '../../utils/entity';

mod.directive('subjectView', () => {
  return {
    scope: {
      entity: '=',
      model: '=',
      isEditing: '='
    },
    bindToController: true,
    controllerAs: 'ctrl',
    restrict: 'E',
    controller: SubjectViewController,
    template: require('./subjectView.html')
  };
});

class SubjectViewController {

  entity: Class|Predicate;
  model: Model;
  isEditing: () => boolean;

  constructor(private searchConceptModal: SearchConceptModal, private languageService: LanguageService) {
  }

  get vocabularies(): string {
    if (isConcept(this.entity.subject)) {
      return this.entity.subject.vocabularies
        .map(vocabulary => this.languageService.translate(vocabulary.title, this.model))
        .join(', ');
    } else {
      return '';
    }
  }

  changeSubject() {
    const normalizedType = this.entity.normalizedType;
    if (normalizedType === 'property') {
      throw new Error('Must be known predicate type');
    }
    this.searchConceptModal.openSelection(this.model.modelVocabularies, this.model, true, normalizedType).then(concept => this.entity.subject = concept);
  }
}
