import { IAttributes, INgModelController, IScope } from 'angular';
import { Localizable, LanguageContext } from '../../services/entities';
import { LanguageService } from '../../services/languageService';
import { isValidString, isValidLabelLength, isValidModelLabelLength } from './validators';
import { allLocalizations, hasLocalization } from '../../utils/language';
import { module as mod }  from './module';

interface LocalizedInputAttributes extends IAttributes {
  localizedInput: 'required' | 'label' | 'modelLabel' | 'free';
}

interface LocalizedInputScope extends IScope {
  context: LanguageContext;
}

mod.directive('localizedInput', /* @ngInject */ (languageService: LanguageService) => {
  return {
    restrict: 'A',
    scope: {
      context: '='
    },
    require: 'ngModel',
    link($scope: LocalizedInputScope, element: JQuery, attributes: LocalizedInputAttributes, ngModel: INgModelController) {
      let localized: Localizable;

      function setPlaceholder() {
        element.attr('placeholder', languageService.translate(localized, $scope.context));
      }

      function removePlaceholder() {
        element.removeAttr('placeholder');
      }

      $scope.$watch(() => languageService.getModelLanguage($scope.context), lang => {
        const val = localized[lang];
        if (!val) {
          setPlaceholder();
        }
        element.val(val);
      });

      ngModel.$parsers.push(viewValue => {
        localized = Object.assign(localized, {
          [languageService.getModelLanguage($scope.context)]: viewValue
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
        const val = localized[languageService.getModelLanguage($scope.context)];
        if (!val) {
          setPlaceholder();
        }
        return val;
      });

      if (attributes.localizedInput !== 'free') {
        ngModel.$validators['string'] = modelValue => allLocalizations(isValidString, modelValue);
      }

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
