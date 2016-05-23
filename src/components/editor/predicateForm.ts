import { Association, Model, Predicate } from '../../services/entities';
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

  linkToSuperProperty() {
    return this.model.linkTo({ type: this.predicate.type, id: this.predicate.subPropertyOf }, true);
  }

  linkToValueClass() {
    const predicate = this.predicate;
    if (predicate instanceof Association) {
      return this.model.linkTo({ type: 'class', id: predicate.valueClass }, true);
    } else {
      return '';
    }
  }
}
