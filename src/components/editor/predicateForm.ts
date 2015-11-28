import { ModelCache } from '../../services/modelCache';
import { Association, Model, Predicate } from '../../services/entities';

export const mod = angular.module('iow.components.editor');

mod.directive('predicateForm', () => {
  'ngInject';
  return {
    scope: {
      predicate: '=',
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

  constructor(private modelCache: ModelCache) {
  }

  linkToSubProperty() {
    return this.model.linkToCurie(this.predicate.type, this.predicate.subPropertyOf, this.modelCache);
  }

  linkToValueClass() {
    const predicate = this.predicate;
    if (predicate instanceof Association) {
      return this.model.linkToCurie('class', predicate.valueClass, this.modelCache);
    }
  }
}
