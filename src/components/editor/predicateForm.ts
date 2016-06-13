import { Association, Model, Predicate } from '../../services/entities';
import { module as mod }  from './module';
import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import { PredicateViewController } from './predicateView';
import { isDefined } from '../../utils/object';

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
    require: ['predicateForm', '?^predicateView'],
    link($scope: IScope, element: JQuery, attributes: IAttributes, [predicateFormController, predicateViewController]: [PredicateFormController, PredicateViewController]) {
      predicateFormController.shouldAutofocus = !isDefined(predicateViewController);
    },
    controller: PredicateFormController
  };
});

class PredicateFormController {

  model: Model;
  predicate: Predicate;
  oldPredicate: Predicate;
  shouldAutofocus: boolean;

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
