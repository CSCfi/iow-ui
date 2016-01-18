import * as _ from 'lodash';
import { ModelCache } from '../../services/modelCache';
import { Association, Model, Predicate, states } from '../../services/entities';

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

  constructor(private modelCache: ModelCache) {
  }

  linkToSuperProperty() {
    return this.model.linkTo(this.predicate.type, this.predicate.subPropertyOf, this.modelCache);
  }

  linkToValueClass() {
    const predicate = this.predicate;
    if (predicate instanceof Association) {
      return this.model.linkTo('class', predicate.valueClass, this.modelCache);
    }
  }

  get labelName(): string {
    return _.capitalize(this.predicate.type) + ' label';
  }

  get inUnstableState(): boolean {
    return this.predicate.state === states.unstable;
  }
}
