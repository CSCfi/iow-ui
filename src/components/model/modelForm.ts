import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import { Model } from '../../services/entities';
import { module as mod }  from './module';

mod.directive('modelForm', () => {
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
