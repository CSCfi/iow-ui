import { Association, Model, Predicate } from '../../services/entities';

export const mod = angular.module('iow.components.editor');

mod.directive('predicateForm', () => {
  'ngInject';
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
    return this.model.linkTo(this.predicate.type, this.predicate.subPropertyOf, this.model);
  }

  linkToValueClass() {
    const predicate = this.predicate;
    if (predicate instanceof Association) {
      return this.model.linkTo('class', predicate.valueClass, this.model);
    }
  }

  get inUnstableState(): boolean {
    return this.predicate.state === 'Unstable';
  }
}
