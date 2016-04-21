import IAttributes = angular.IAttributes;
import IFormController = angular.IFormController;
import INgModelController = angular.INgModelController;
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import gettextCatalog = angular.gettext.gettextCatalog;
import IModelValidators = angular.IModelValidators;
import { module as mod }  from './module';
import { DataType } from '../../services/dataTypes';
import { resolveValidator } from '../form/validators';
import { placeholderText } from '../form/dataTypeInput';

mod.directive('editableMultipleDataTypeInput', () => {
  return {
    scope: {
      ngModel: '=',
      inputType: '@',
      id: '@',
      title: '@'
    },
    restrict: 'E',
    controllerAs: 'ctrl',
    bindToController: true,
    template: `<editable-multiple id="{{ctrl.id}}" data-title="{{ctrl.title}}" ng-model="ctrl.ngModel" validators="ctrl.validators" placeholder="ctrl.placeholder"></editable-multiple>`,
    controller: EditableMultipleDataTypeInputController
  };
});

class EditableMultipleDataTypeInputController {

  ngModel: string[];
  inputType: DataType;
  id: string;
  title: string;

  validators: IModelValidators;
  placeholder: string;

  /* @ngInject */
  constructor($scope: IScope, gettextCatalog: gettextCatalog) {
    $scope.$watch(() => this.inputType, type => {
      this.validators = { [type]: resolveValidator(type) };
      this.placeholder = placeholderText(type, gettextCatalog);
    });
  }
}
