import { IScope, IAttributes, INgModelController, IModelValidators } from 'angular';
import gettextCatalog = angular.gettext.gettextCatalog;
import { isValidLanguageCode } from './validators';
import { module as mod }  from './module';
import { LanguageService } from '../../services/languageService';

export function placeholderText(gettextCatalog: gettextCatalog) {
  return gettextCatalog.getString('Input') + ' ' + gettextCatalog.getString('language code') + '...';
}

export function createValidators(): IModelValidators {
  return { languageCode: isValidLanguageCode };
}

mod.directive('languageInput', /* @ngInject */ (languageService: LanguageService, gettextCatalog: gettextCatalog) => {
  return {
    scope: {
      model: '='
    },
    restrict: 'A',
    require: 'ngModel',
    link($scope: IScope, element: JQuery, attributes: IAttributes, modelController: INgModelController) {

      if (!attributes['placeholder']) {
        $scope.$watch(() => languageService.UILanguage, () => {
          element.attr('placeholder', placeholderText(gettextCatalog));
        });
      }

      const validators = createValidators();

      for (const validatorName of Object.keys(validators)) {
        modelController.$validators[validatorName] = validators[validatorName];
      }
    }
  };
});
