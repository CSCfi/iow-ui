import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import IFormController = angular.IFormController;
import INgModelController = angular.INgModelController;
import ILocationService = angular.ILocationService;
import gettextCatalog = angular.gettext.gettextCatalog;
import { DisplayItemFactory, DisplayItem, Value } from './displayItemFactory';
import { EditableForm } from './editableEntityController';

export const mod = angular.module('iow.components.form');

mod.directive('editable', () => {
  return {
    scope: {
      title: '@',
      link: '=',
      valueAsLocalizationKey: '@',
      disable: '='
    },
    restrict: 'E',
    template: require('./editable.html'),
    transclude: true,
    bindToController: true,
    controllerAs: 'ctrl',
    require: ['editable', '?^form'],
    link($scope: EditableScope, element: JQuery, attributes: IAttributes, [thisController, formController]: [EditableController, EditableForm]) {
      const input = element.find('[ng-model]');
      const ngModel = input.controller('ngModel');
      const isEditing = () => formController.editing && !thisController.disable;

      // move error messages element next to input
      input.after(element.find('error-messages').detach());

      // TODO: prevent hidden and non-editable fields participating validation with some more obvious mechanism
      $scope.$watchCollection(() => Object.keys(ngModel.$error), keys => {
        if (!isEditing()) {
          for (const key of keys) {
            ngModel.$setValidity(key, true);
          }
        }
      });

      thisController.isEditing = isEditing;
      $scope.ngModel = ngModel;

      Object.defineProperty(thisController, 'value', { get: () => {
        return ngModel && ngModel.$modelValue;
      }});

      Object.defineProperty(thisController, 'inputId', { get: () => {
        return input.attr('id');
      }});

      Object.defineProperty(thisController, 'required', { get: () => {
        return input.attr('required') || (ngModel && 'requiredLocalized' in ngModel.$validators);
      }});
    },
    controller: EditableController
  };
});

interface EditableScope extends IScope {
  ngModel: INgModelController;
}

class EditableController {

  value: Value;
  title: string;
  valueAsLocalizationKey: boolean;
  link: string;
  disable: boolean;
  required: boolean;
  inputId: string;
  isEditing: () => boolean;

  item: DisplayItem;

  /* @ngInject */
  constructor(private displayItemFactory: DisplayItemFactory) {
    this.item = displayItemFactory.create(() => this.value, (value: string) => this.link, this.valueAsLocalizationKey);
  }
}
