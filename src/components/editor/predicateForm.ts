import { Association, Model, Predicate } from '../../services/entities';
import { normalizeModelType } from '../../services/utils';

import { module as mod }  from './module';

mod.directive('predicateForm', () => {
  return {
    scope: {
      predicate: '=',
      oldPredicate: '=',
      model: '='
    },
    restrict: 'E',
    template: require('./predicateForm.html'),
    bindToController: true,
    controllerAs: 'ctrl',
    controller: PredicateFormController
  };
});

class PredicateFormController {

  model: Model;
  predicate: Predicate;
  oldPredicate: Predicate;

  get definedByTitle() {
    return normalizeModelType(this.predicate.definedBy.type);
  }

  linkToSuperProperty() {
    return this.model.linkTo(this.predicate.type, this.predicate.subPropertyOf);
  }

  linkToValueClass() {
    const predicate = this.predicate;
    if (predicate instanceof Association) {
      return this.model.linkTo('class', predicate.valueClass);
    } else {
      return '';
    }
  }

  get inUnstableState(): boolean {
    return this.predicate.state === 'Unstable';
  }
}
