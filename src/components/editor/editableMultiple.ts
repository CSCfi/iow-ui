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
import { module as mod }  from './module';
import { arrayValidator } from '../form/validators';
import { extendNgModelOptions, normalizeAsArray, isDefined } from '../../services/utils';

type DropSide = 'left' | 'right';

class Drag {

  toIndex: number;

  constructor(public value: any, public fromIndex: number) {
  }

  isActive(index: number) {
    return this.canDrop(index) && this.toIndex === index;
  }

  canDrop(index: number) {
    return index !== this.fromIndex && index !== this.fromIndex + 1;
  }
}

mod.directive('editableMultiple', () => {
  return {
    scope: {
      ngModel: '=',
      id: '@',
      title: '@',
      allowInput: '=',
      placeholder: '=',
      validators: '=',
      parser: '=',
      formatter: '=',
      link: '=',
      required: '='
    },
    restrict: 'E',
    controllerAs: 'ctrl',
    bindToController: true,
    transclude: true,
    template: require('./editableMultiple.html'),
    require: ['editableMultiple', 'ngModel', '?^form'],
    link($scope: EditableMultipleScope, element: JQuery, attributes: IAttributes, [thisController, ngModel, formController]: [EditableMultipleController<any>, INgModelController, EditableForm]) {
      thisController.isEditing = () => formController.editing;

      const inputElement = element.find('input');
      const inputNgModel = inputElement.controller('ngModel');

      extendNgModelOptions(ngModel, { allowInvalid: true });

      $scope.ngModelControllers = [inputNgModel, ngModel];
      $scope.$watchCollection(() => thisController.ngModel, () => ngModel.$validate());

      $scope.$watch(() => thisController.parser, parser => inputNgModel.$parsers = normalizeAsArray(parser));
      $scope.$watch(() => thisController.formatter, formatter => inputNgModel.$formatters = normalizeAsArray(formatter));
      $scope.$watch(() => thisController.placeholder, placeholder => inputElement.attr('placeholder', placeholder));
      $scope.$watch(() => thisController.validators, (validators, oldValidators) => {

        if (thisController.required) {
          ngModel.$validators['required'] = (value: any[]) => value && value.length > 0;
        }

        if (oldValidators) {
          for (const validator of Object.keys(oldValidators)) {
            delete ngModel.$validators[validator];
            delete inputNgModel.$validators[validator];
            ngModel.$setValidity(validator, true);
            inputNgModel.$setValidity(validator, true);
          }
        }

        if (validators) {
          for (const validator of Object.keys(validators)) {
            const instance = validators[validator];
            ngModel.$validators[validator] = arrayValidator(instance);
            inputNgModel.$validators[validator] = instance;
          }
        }

        ngModel.$validate();
        inputNgModel.$validate();
      });
    },
    controller: EditableMultipleController
  };
});

interface EditableMultipleScope extends IScope {
  ngModelControllers: INgModelController[];
}

export class EditableMultipleController<T> {

  ngModel: T[];
  id: string;
  title: string;
  placeholder: string;
  validators: IModelValidators;
  parser: IModelParser|IModelParser[];
  formatter: IModelFormatter|IModelFormatter[];
  link: (item: T) => string;
  required: boolean;

  isEditing: () => boolean;
  input: T;
  drag: Drag;

  format(value: T): string {
    let result = value;
    for (const formatter of normalizeAsArray(this.formatter)) {
      result = formatter(result);
    }
    return result.toString();
  }

  isValid(value: T) {
    if (this.validators) {
      for (const validator of Object.values(this.validators)) {
        if (!validator(value)) {
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

  getDragClasses(index: number) {
    return ['drop-target', { visible: this.drag && this.drag.canDrop(index), active: this.drag && this.drag.isActive(index) } ];
  }

  startDrag(event: JQueryEventObject, drag: Drag): void {

    const dataTransfer = (<DragEvent> event.originalEvent).dataTransfer;

    dataTransfer.dropEffect = 'move';
    dataTransfer.effectAllowed = 'move';

    this.drag = drag;
  }

  dragOverIndex(event: JQueryEventObject, index?: number) {

    if (isDefined(index) && this.drag.canDrop(index)) {
      event.preventDefault();
    }

    this.drag.toIndex = index;
  }

  cancelDrag(event: JQueryEventObject) {
    this.drag = null;
  }

  drop(event: JQueryEventObject) {
    event.preventDefault();

    this.ngModel.splice(this.drag.fromIndex, 1);
    this.ngModel.splice(this.drag.toIndex <= this.drag.fromIndex ? this.drag.toIndex : this.drag.toIndex - 1, 0, this.drag.value);
    this.drag = null;
  }
}

interface RepeaterScope extends IScope {
  $index: number;
  value: any;
}

mod.directive('editableMultipleDraggable', () => {
  return {
    require: '^editableMultiple',
    link($scope: RepeaterScope, element: JQuery, attributes: IAttributes, editableMultiple: EditableMultipleController<any>) {
      element.attr('draggable', 'true');
      element.on('dragstart', event => $scope.$apply(() => editableMultiple.startDrag(event, new Drag($scope.value, $scope.$index))));
      element.on('dragend', event => $scope.$apply(() => editableMultiple.cancelDrag(event)));
    }
  };
});

interface EditableMultipleDroppableAttributes {
  editableMultipleDroppable: DropSide;
}

mod.directive('editableMultipleDroppable', () => {
  return {
    require: '^editableMultiple',
    link($scope: RepeaterScope, element: JQuery, attributes: EditableMultipleDroppableAttributes, editableMultiple: EditableMultipleController<any>) {


      function index(event: JQueryEventObject) {

        const position = (<DragEvent> event.originalEvent).x;
        const center = element.offset().left + element.width() / 2;

        if (attributes.editableMultipleDroppable === 'left' || position < center) {
          return $scope.$index;
        } else {
          return $scope.$index + 1;
        }
      }

      element.on('dragover', event => $scope.$apply(() => editableMultiple.dragOverIndex(event, index(event))));
      element.on('dragleave', event => $scope.$apply(() => editableMultiple.dragOverIndex(event)));
      element.on('drop', event => $scope.$apply(() => editableMultiple.drop(event)));
    }
  };
});
