import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import { Model } from '../../services/entities';

export const mod = angular.module('iow.components.model');

mod.directive('modelForm', () => {
  'ngInject';

  return {
    scope: {
      model: '='
    },
    restrict: 'E',
    template: require('./modelForm.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    require: ['referencesView', '^modelView'],
    controller: ModelFormController
  };
});

class ModelFormController {

  model: Model;
}
