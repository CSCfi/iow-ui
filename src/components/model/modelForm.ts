import { IAttributes, IScope } from 'angular';
import { Model } from '../../services/entities';
import { module as mod }  from './module';
import { ModelViewController } from './modelView';

mod.directive('modelForm', () => {
  return {
    scope: {
      model: '=',
      modelController: '='
    },
    restrict: 'E',
    template: require('./modelForm.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    require: ['modelForm', '?^modelView'],
    controller: ModelFormController,
    link($scope: IScope, element: JQuery, attributes: IAttributes, [modelFormController, modelViewController]: [ModelFormController, ModelViewController]) {
      modelFormController.isEditing = () => modelViewController && modelViewController.isEditing();
    }
  };
});

class ModelFormController {
  model: Model;
  isEditing: () => boolean;
}
