import { module as mod }  from './module';
import { SearchConceptModal } from './searchConceptModal';
import { Class } from '../../entities/class';
import { Predicate } from '../../entities/predicate';
import { Model } from '../../entities/model';

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

  constructor(private searchConceptModal: SearchConceptModal) {
  }

  changeSubject() {
    const normalizedType = this.entity.normalizedType;
    if (normalizedType === 'property') {
      throw new Error('Must be known predicate type');
    }
    this.searchConceptModal.openSelection(this.model.modelVocabularies, this.model, true, normalizedType).then(concept => this.entity.subject = concept);
  }
}
