import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import IScope = angular.IScope;
import { Localizable } from '../../services/entities';
import { LanguageService } from '../../services/languageService';
import { isStringValid, isValidLabelLength, isValidModelLabelLength } from './stringInput';
import { hasLocalization } from '../../services/utils';

export const mod = angular.module('iow.components.form');

interface LocalizedInputAttributes extends IAttributes {
  localizedInput: string;
}

function anyLocalization(localizable: Localizable, predicate: (localized: string) => boolean) {
  if (localizable) {
    for (let localized of Object.values(localizable)) {
      if (!predicate(localized)) {
        return false;
      }
    }
  }
  return true;
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
        return anyLocalization(modelValue, isStringValid);
      };

      switch (attributes.localizedInput) {
        case 'required':
          ngModel.$validators['requiredLocalized'] = hasLocalization;
          break;
        case 'label':
          ngModel.$validators['requiredLocalized'] = hasLocalization;
          ngModel.$validators['length'] = modelValue => anyLocalization(modelValue, isValidLabelLength);
          break;
        case 'modelLabel':
          ngModel.$validators['requiredLocalized'] = hasLocalization;
          ngModel.$validators['length'] = modelValue => anyLocalization(modelValue, isValidModelLabelLength);
          break;
      }
    }
  };
});
