import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import IScope = angular.IScope;
import { Localizable } from '../../services/entities';
import { LanguageService } from '../../services/languageService';
import { isStringValid, isValidLabelLength } from './stringInput';

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

      if (attributes.localizedInput === 'required' || attributes.localizedInput === 'label') {
        modelController.$validators['requiredLocalized'] = modelValue => {
          return !!languageService.translate(modelValue);
        };
      }

      if (attributes.localizedInput === 'label') {
        modelController.$validators['length'] = modelValue => {
          return anyLocalization(modelValue, isValidLabelLength);
        };
      }

      modelController.$validators['string'] = modelValue => {
        return anyLocalization(modelValue, isStringValid);
      };
    }
  };
});
