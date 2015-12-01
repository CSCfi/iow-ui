import ILocationService = angular.ILocationService;
import gettextCatalog = angular.gettext.gettextCatalog;
import { Localizable, isLocalizable } from '../../services/entities';
import { isString } from '../../services/utils';
import { LanguageService } from '../../services/languageService';
import { FormElementController } from "./formElementController";
import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import {EditableEntityController} from "./editableEntityController";
import IFormController = angular.IFormController;

export const mod = angular.module('iow.components.form');

mod.directive('nonEditable', () => {
  'ngInject';
  return {
    scope: {
      title: '@',
      value: '=',
      link: '=',
      valueAsLocalizationKey: '@'
    },
    restrict: 'E',
    template: require('./nonEditable.html'),
    bindToController: true,
    controllerAs: 'ctrl',
    require: ['nonEditable', '?^form'],
    link($scope: IScope, element: JQuery, attributes: IAttributes, controllers: any[]) {
      controllers[0].isEditing = () => controllers[1].editing;
    },
    controller: NonEditableController
  };
});

class NonEditableController extends FormElementController {

  isEditing: () => boolean;
  value: string|Localizable;

  /* @ngInject */
  constructor($location: ILocationService, languageService: LanguageService, gettextCatalog: gettextCatalog) {
    super($location, languageService, gettextCatalog);
  }

  showNonEditable() {
    return true;
  }

  hideLinks() {
    return this.isEditing();
  }

  getValue(): string|Localizable {
    return this.value;
  }
}
