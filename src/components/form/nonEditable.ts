import ILocationService = angular.ILocationService;
import gettextCatalog = angular.gettext.gettextCatalog;
import { Localizable, isLocalizable } from '../../services/entities';
import { isString } from '../../services/utils';
import { LanguageService } from '../../services/languageService';
import { FormElementController } from "./formElementController";

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
    controller: NonEditableController
  };
});

class NonEditableController extends FormElementController {

  value: string|Localizable;

  /* @ngInject */
  constructor($location: ILocationService, languageService: LanguageService, gettextCatalog: gettextCatalog) {
    super($location, languageService, gettextCatalog);
  }

  showNonEditable() {
    return true;
  }

  getValue(): string|Localizable {
    return this.value;
  }
}
