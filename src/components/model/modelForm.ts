import { IAttributes, IScope } from 'angular';
import { module as mod }  from './module';
import { ModelViewController } from './modelView';
import { Model } from '../../entities/model';

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
    link(_$scope: IScope, _element: JQuery, _attributes: IAttributes, [modelFormController, modelViewController]: [ModelFormController, ModelViewController]) {
      modelFormController.isEditing = () => modelViewController && modelViewController.isEditing();
    }
  };
});

class ModelFormController {
  model: Model;
  isEditing: () => boolean;
}
