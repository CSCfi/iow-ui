import IAttributes = angular.IAttributes;
import IFormController = angular.IFormController;
import INgModelController = angular.INgModelController;
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import * as _ from 'lodash';
import { EditableForm } from '../form/editableEntityController';
import { module as mod }  from './module';
import { DataType } from '../common/dataTypes';
import { resolveValidator, arrayValidator } from '../form/validators';
import { extendNgModelOptions } from '../../services/utils';

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
    template: require('./editableMultipleDataTypeInput.html'),
    require: ['editableMultipleDataTypeInput', 'ngModel', '?^form'],
    link($scope: EditableMultipleUriSelectScope, element: JQuery, attributes: IAttributes, [thisController, ngModel, formController]: [EditableMultipleDataTypeInputController, INgModelController, EditableForm]) {
      thisController.isEditing = () => formController.editing;

      $scope.ngModelControllers = [element.find('input').controller('ngModel'), ngModel];

      $scope.$watch(() => thisController.inputType, () => ngModel.$validate());
      $scope.$watchCollection(() => thisController.ngModel, () => ngModel.$validate());

      extendNgModelOptions(ngModel, { allowInvalid: true });

      $scope.$watch<DataType>(() => thisController.inputType, (dataType, oldDataType) => {
        const validator = resolveValidator(dataType);

        if (oldDataType) {
          delete ngModel.$validators[oldDataType];
          ngModel.$setValidity(oldDataType, true);
        }

        ngModel.$validators[dataType] = arrayValidator(validator);
        ngModel.$validate();
      });
    },
    controller: EditableMultipleDataTypeInputController
  };
});

interface EditableMultipleUriSelectScope extends IScope {
  ngModelControllers: INgModelController[];
}

class EditableMultipleDataTypeInputController {

  ngModel: string[];
  inputType: DataType;
  id: string;
  isEditing: () => boolean;
  input: string;
  title: string;

  isValid(value: string) {
    return resolveValidator(this.inputType)(value);
  }

  deleteValue(value: string) {
    _.remove(this.ngModel, v => v === value);
  }

  keyPressed(event: JQueryEventObject) {
    const enter = 13;
    if (event.keyCode === enter) {
      event.preventDefault();
      this.addValueFromInput();
    }
  }

  addValueFromInput() {
    if (this.input) {
      this.ngModel.push(this.input);
      this.input = null;
    }
  }
}
