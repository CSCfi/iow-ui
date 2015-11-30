import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import IFormController = angular.IFormController;
import INgModelController = angular.INgModelController;
import ILocationService = angular.ILocationService;
import gettextCatalog = angular.gettext.gettextCatalog;
import * as _ from 'lodash';
import { LanguageService } from '../../services/languageService';
import { EditableForm } from './editableEntityController';
import { FormElementController } from "./formElementController";
import { Localizable, isLocalizable } from '../../services/entities';
import { isString } from '../../services/utils';

export const mod = angular.module('iow.components.form');

mod.directive('editable', () => {
  'ngInject';
  return {
    scope: {
      title: '@',
      link: '=',
      valueAsLocalizationKey: '@'
    },
    restrict: 'E',
    template: require('./editable.html'),
    transclude: true,
    bindToController: true,
    controllerAs: 'ctrl',
    require: ['editable', '?^form'],
    link($scope: IScope, element: JQuery, attributes: IAttributes, controllers: any[]) {
      const input = element.find('[ng-model]');
      input.after(element.find('error-messages').detach());
      const editableController = controllers[0];
      editableController.ngModelController = input.controller('ngModel');
      editableController.isEditing = () => controllers[1].editing;
    },
    controller: EditableController
  }
});


class EditableController extends FormElementController {

  isEditing: () => boolean;
  ngModelController: INgModelController;

  constructor($location: ILocationService, languageService: LanguageService, gettextCatalog: gettextCatalog) {
    super($location, languageService, gettextCatalog);
  }

  showNonEditable() {
    return !this.isEditing || !this.isEditing();
  }

  getValue() {
    return this.ngModelController && this.ngModelController.$modelValue;
  }
}
