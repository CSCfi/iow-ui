import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import IScope = angular.IScope;
import { Localizable } from '../../services/entities';
import { LanguageService } from '../../services/languageService';
import { hasLocalization, allLocalizations } from '../../services/utils';
import { isStringValid, isValidLabelLength, isValidModelLabelLength } from './validators';

export const mod = angular.module('iow.components.form');

interface LocalizedInputAttributes extends IAttributes {
  localizedInput: string;
}

mod.directive('localizedInput', (languageService: LanguageService) => {
  'ngInject';
  return {
    restrict: 'A',
    require: 'ngModel',
    link($scope: IScope, element: JQuery, attributes: LocalizedInputAttributes, ngModel: INgModelController) {
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

      ngModel.$parsers.push(viewValue => {
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

      ngModel.$formatters.push(modelValue => {
        localized = modelValue || {};
        const val = localized[languageService.modelLanguage];
        if (!val) {
          setPlaceholder();
        }
        return val;
      });

      ngModel.$validators['string'] = modelValue => {
        return allLocalizations(isStringValid, modelValue);
      };

      switch (attributes.localizedInput) {
        case 'required':
          ngModel.$validators['requiredLocalized'] = hasLocalization;
          break;
        case 'label':
          ngModel.$validators['requiredLocalized'] = hasLocalization;
          ngModel.$validators['length'] = modelValue => allLocalizations(isValidLabelLength, modelValue);
          break;
        case 'modelLabel':
          ngModel.$validators['requiredLocalized'] = hasLocalization;
          ngModel.$validators['length'] = modelValue => allLocalizations(isValidModelLabelLength, modelValue);
          break;
      }
    }
  };
});
