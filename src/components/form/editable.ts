import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import IFormController = angular.IFormController;
import INgModelController = angular.INgModelController;
import ILocationService = angular.ILocationService;
import gettextCatalog = angular.gettext.gettextCatalog;
import { DisplayItemFactory, DisplayItem, Value } from './displayItemFactory';

export const mod = angular.module('iow.components.form');

mod.directive('editable', () => {
  'ngInject';
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
    link($scope: EditableScope, element: JQuery, attributes: IAttributes, controllers: any[]) {
      const editableController: EditableController = controllers[0];
      const input = element.find('[ng-model]');
      const ngModel = input.controller('ngModel');
      const isEditing = () => controllers[1].editing && !editableController.disable;

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

      editableController.isEditing = isEditing;
      $scope.ngModel = ngModel;

      Object.defineProperty(editableController, 'value', { get: () => {
        return ngModel && ngModel.$modelValue;
      }});

      Object.defineProperty(editableController, 'inputId', { get: () => {
        return input.attr('id');
      }});

      Object.defineProperty(editableController, 'required', { get: () => {
        return input.attr('required') || (ngModel && 'requiredLocalized' in ngModel.$validators);
      }});
    },
    controller: EditableController
  }
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
