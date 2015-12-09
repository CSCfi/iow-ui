import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import IFormController = angular.IFormController;
import INgModelController = angular.INgModelController;
import ILocationService = angular.ILocationService;
import gettextCatalog = angular.gettext.gettextCatalog;
import * as _ from 'lodash';
import { LanguageService } from '../../services/languageService';
import { EditableForm } from './editableEntityController';
import { DisplayItemFactory, DisplayItem, Value } from './displayItemFactory';
import { Localizable, isLocalizable } from '../../services/entities';
import { isString } from '../../services/utils';

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
    link($scope: IScope, element: JQuery, attributes: IAttributes, controllers: any[]) {
      const editableController: EditableController = controllers[0];
      const formController: EditableForm = controllers[1];
      const input = element.find('[ng-model]');
      input.after(element.find('error-messages').detach());
      Object.defineProperty(editableController, 'inputId', { get: () => input.attr('id') });
      editableController.ngModelController = input.controller('ngModel');
      editableController.isEditing = () => formController.editing && !editableController.disable;
    },
    controller: EditableController
  }
});

class EditableController {

  title: string;
  valueAsLocalizationKey: boolean;
  link: string;
  disable: boolean;

  inputId: string;
  isEditing: () => boolean;
  ngModelController: INgModelController;

  item: DisplayItem;

  /* @ngInject */
  constructor(private displayItemFactory: DisplayItemFactory) {
    const value: () => Value = () => this.ngModelController && this.ngModelController.$modelValue;
    this.item = displayItemFactory.create(value, (value: string) => this.link, this.valueAsLocalizationKey);
  }

  get required(): boolean {
    if (this.ngModelController) {
      const validators = this.ngModelController.$validators;
      return 'required' in validators || 'requiredLocalized' in validators;
    }
  }
}
