import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import IScope = angular.IScope;
import { Localizable } from '../../services/entities';
import { LanguageService } from '../../services/languageService';

export const mod = angular.module('iow.components.form');

interface LocalizedInputAttributes extends IAttributes {
  localizedInput: string;
}

mod.directive('localizedInput', (languageService: LanguageService) => {
  'ngInject';
  return {
    restrict: 'A',
    require: 'ngModel',
    link($scope: IScope, element: JQuery, attributes: LocalizedInputAttributes, modelController: INgModelController) {
      let localized: Localizable;

      $scope.$watch(() => languageService.modelLanguage, lang => {
        element.val(localized[lang]);
      });

      modelController.$parsers.push(viewValue => {
        localized = Object.assign(localized, {
          [languageService.modelLanguage]: viewValue
        });
        return localized;
      });

      modelController.$formatters.push(modelValue => {
        localized = modelValue || {};
        return localized[languageService.modelLanguage];
      });

      if (attributes.localizedInput === "required") {
        modelController.$validators['requiredLocalized'] = modelValue => {
          return !!languageService.translate(modelValue);
        };
      }
    }
  };
});
