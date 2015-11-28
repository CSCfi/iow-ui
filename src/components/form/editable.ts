import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import IFormController = angular.IFormController;
import INgModelController = angular.INgModelController;
import ILocationService = angular.ILocationService;
import gettextCatalog = angular.gettext.gettextCatalog;
import { LanguageService } from '../../services/languageService';
import { EditableForm } from './editableEntityController';
import { Localizable, isLocalizable } from '../../services/entities';
import { isString } from '../../services/utils';

export const mod = angular.module('iow.components.form');

mod.directive('editable', () => {
  'ngInject';
  return {
    scope: {
      title: '@',
      link: '=',
      externalLink: '=',
      valueAsLocalizationKey: '@'
    },
    restrict: 'E',
    template: require('./editable.html'),
    transclude: true,
    bindToController: true,
    controllerAs: 'ctrl',
    require: ['editable', '?^form'],
    link($scope: EditableScope, element: JQuery, attributes: IAttributes, controllers: any[]) {
      $scope.formController = controllers[1];
      controllers[0].ngModel = element.find('[ng-model]').controller('ngModel');
    },
    controller: EditableController
  }
});

interface EditableScope extends IScope {
  formController: EditableForm;
}

class EditableController {

  ngModel: INgModelController;
  title: string;
  link: string;
  externalLink: string;
  valueAsLocalizationKey: boolean;

  /* @ngInject */
  constructor(private $location: ILocationService, private languageService: LanguageService, private gettextCatalog: gettextCatalog) {
  }

  isDifferentUrl(url: string): boolean {
    return this.$location.url().replace(/:/g, '%3A') !== url;
  }

  displayValue(): string {
    const value: Localizable|string = this.ngModel && this.ngModel.$modelValue;

    if (isLocalizable(value)) {
      return this.languageService.translate(value);
    } else if (isString(value)) {
      return value && this.valueAsLocalizationKey ? this.gettextCatalog.getString(value) : value;
    }
  }
}
