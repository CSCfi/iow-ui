import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import IQService = angular.IQService;
import IModelValidators = angular.IModelValidators;
import gettextCatalog = angular.gettext.gettextCatalog;
import { Model } from '../../services/entities';
import { isValidUri, isValidUrl } from './validators';
import { Uri } from '../../services/uri';
import { module as mod }  from './module';
import { LanguageService } from '../../services/languageService';

type UriInputType = 'required-namespace' | 'free-url';

interface UriInputAttributes extends IAttributes {
  uriInput: UriInputType;
}

export function placeholderText(gettextCatalog: gettextCatalog) {
  return gettextCatalog.getString('Write identifier');
}

export function createParser(modelProvider: () => Model) {
  return (viewValue: string) => !viewValue ? null : new Uri(viewValue, modelProvider().context);
}

export function createFormatter() {
  return (value: Uri) => value ? value.compact : '';
}

export function createValidators(type: UriInputType, modelProvider: () => Model) {

  const result: IModelValidators = {};

  result['xsd:anyURI'] = isValidUri;

  if (type === 'free-url') {
    result['url'] = value => {
      return !value || !isValidUri(value) || isValidUrl(value);
    };
  } else {
    if (type === 'required-namespace') {
      result['mustBeRequiredNS'] = value => {
        function isRequiredNamespace(ns: string) {
          for (const require of modelProvider().namespaces) {
            if (ns === require.namespace) {
              return true;
            }
          }
          return false;
        }

        return !value || !isValidUri(value) || !value.hasResolvablePrefix() || isRequiredNamespace(value.namespace);
      };
    }
    result['unknownNS'] = value => {
      return !value || !isValidUri(value) || value.hasResolvablePrefix();
    };

    result['idNameRequired'] = value => {
      return !value || !isValidUri(value) || !value.hasResolvablePrefix() || value.name.length > 0;
    };
  }

  return result;
}

mod.directive('uriInput', /* @ngInject */ (languageService: LanguageService, gettextCatalog: gettextCatalog) => {
  return {
    scope: {
      model: '='
    },
    restrict: 'A',
    require: 'ngModel',
    link($scope: UriInputScope, element: JQuery, attributes: UriInputAttributes, modelController: INgModelController) {

      if (!attributes['placeholder']) {
        $scope.$watch(() => languageService.UILanguage, () => {
          element.attr('placeholder', placeholderText(gettextCatalog));
        });
      }

      modelController.$parsers = [createParser(() => $scope.model)];
      modelController.$formatters = [createFormatter()];

      const validators = createValidators(attributes.uriInput, () => $scope.model);

      for (const validatorName of Object.keys(validators)) {
        modelController.$validators[validatorName] = validators[validatorName];
      }
    }
  };
});

interface UriInputScope extends IScope {
  model: Model;
}
