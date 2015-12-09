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

      function setPlaceholder() {
        element.attr('placeholder', languageService.translate(localized));
      }

      function removePlaceholder() {
        element.attr('placeholder', null);
      }

      $scope.$watch(() => languageService.modelLanguage, lang => {
        const val = localized[lang];
        if (!val) {
          setPlaceholder();
        }
        element.val(val);
      });

      modelController.$parsers.push(viewValue => {
        localized = Object.assign(localized, {
          [languageService.modelLanguage]: viewValue
        });
        if (viewValue) {
          removePlaceholder();
        } else {
          setPlaceholder();
        }
        return localized;
      });

      modelController.$formatters.push(modelValue => {
        localized = modelValue || {};
        const val = localized[languageService.modelLanguage];
        if (!val) {
          setPlaceholder();
        }
        return val;
      });

      if (attributes.localizedInput === "required") {
        modelController.$validators['requiredLocalized'] = modelValue => {
          return !!languageService.translate(modelValue);
        };
      }
    }
  };
});
