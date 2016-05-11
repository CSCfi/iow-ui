import IAttributes = angular.IAttributes;
import IFormController = angular.IFormController;
import INgModelController = angular.INgModelController;
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import IModelValidators = angular.IModelValidators;
import IModelParser = angular.IModelParser;
import IModelFormatter = angular.IModelFormatter;
import * as _ from 'lodash';
import { EditableForm } from '../form/editableEntityController';
import { arrayValidator } from '../form/validators';
import { extendNgModelOptions, formatWithFormatters } from '../../utils/angular';
import { module as mod }  from './module';

const skipValidators = new Set<string>(['duplicate']);

mod.directive('editableMultiple', () => {
  return {
    scope: {
      ngModel: '=',
      input: '=',
      id: '@',
      title: '@',
      link: '=',
      required: '='
    },
    restrict: 'E',
    controllerAs: 'ctrl',
    bindToController: true,
    transclude: {
      input: 'inputContainer',
      button: '?buttonContainer'
    },
    template: require('./editableMultiple.html'),
    require: ['editableMultiple', 'ngModel', '?^form'],
    link($scope: EditableMultipleScope, element: JQuery, attributes: IAttributes, [thisController, ngModel, formController]: [EditableMultipleController<any>, INgModelController, EditableForm]) {
      thisController.isEditing = () => formController.editing;

      const inputElement = element.find('input');
      const inputNgModel = inputElement.controller('ngModel');

      const keyDownHandler = (event: JQueryEventObject) => $scope.$apply(() => thisController.keyPressed(event));
      const blurHandler = (event: JQueryEventObject) => $scope.$apply(() => thisController.addValueFromInput());

      inputElement.on('keydown', keyDownHandler);
      inputElement.on('blur', blurHandler);

      $scope.$on('destory', () => {
        inputElement.off('keydown', keyDownHandler);
        inputElement.off('blur', blurHandler);
      });

      extendNgModelOptions(ngModel, { allowInvalid: true });
      $scope.ngModelControllers = [inputNgModel, ngModel];

      $scope.$watchCollection(() => inputNgModel.$formatters, formatters => thisController.formatter = formatters);
      $scope.$watchCollection(() => Object.keys(inputNgModel.$validators), (validators, oldValidators) => {

        if (oldValidators) {
          for (const validator of oldValidators) {
            if (!skipValidators.has(validator)) {
              delete ngModel.$validators[validator];
              ngModel.$setValidity(validator, true);
            }
          }
        }

        if (validators) {
          for (const validator of validators) {
            if (!skipValidators.has(validator)) {
              ngModel.$validators[validator] = arrayValidator(inputNgModel.$validators[validator]);
            }
          }
        }

        ngModel.$validate();
      });

      if (thisController.required) {
        ngModel.$validators['required'] = (value: any[]) => value && value.length > 0;
      }

      $scope.$watchCollection(() => thisController.ngModel, () => ngModel.$validate());
    },
    controller: EditableMultipleController
  };
});

interface EditableMultipleScope extends IScope {
  ngModelControllers: INgModelController[];
}

export class EditableMultipleController<T> {

  ngModel: T[];
  input: T;
  id: string;
  title: string;
  validators: IModelValidators;
  formatter: IModelFormatter[];
  link: (item: T) => string;
  required: boolean;

  isEditing: () => boolean;

  format(value: T): string {
    return formatWithFormatters(value, this.formatter);
  }

  isValid(value: T) {
    if (this.validators) {
      for (const validator of Object.values(this.validators)) {
        if (!skipValidators.has(validator) && !validator(value)) {
          return false;
        }
      }
    }
    return true;
  }

  deleteValue(value: T) {
    _.remove(this.ngModel, v => v === value);
  }

  keyPressed(event: JQueryEventObject) {
    const enter = 13;
    if (event.keyCode === enter) {
      event.preventDefault();
      this.addValueFromInput();
    }
  }

  addValue(value: T) {
    this.ngModel.push(value);
  }

  addValueFromInput() {
    if (this.input) {
      this.addValue(this.input);
      this.input = null;
    }
  }
}
