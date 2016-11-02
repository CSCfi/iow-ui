import { IScope, IAttributes, INgModelController, IModelValidators } from 'angular';
import gettextCatalog = angular.gettext.gettextCatalog;
import { isValidUri, isValidUrl, isValidUriStem } from './validators';
import { Uri } from '../../entities/uri';
import { module as mod }  from './module';
import { Model } from '../../entities/model';
import { LanguageService } from '../../services/languageService';

type UriInputType = 'required-namespace' | 'free-url' | 'free-uri' | 'stem';

interface UriInputAttributes extends IAttributes {
  uriInput: UriInputType;
}

export function placeholderText(uriInputType: UriInputType, gettextCatalog: gettextCatalog) {
  switch (uriInputType) {
    case 'free-url':
      return gettextCatalog.getString('Write URL');
    case 'stem':
      return gettextCatalog.getString('Write URI');
    case 'required-namespace':
      return gettextCatalog.getString('Write identifier');
    default:
      return gettextCatalog.getString('Write identifier');
  }
}

export function createParser(modelProvider: () => Model) {
  return (viewValue: string) => {
    const model = modelProvider();
    return !viewValue ? null : new Uri(viewValue, model ? model.context : {});
  };
}

export function createFormatter() {
  return (value: Uri) => value ? value.compact : '';
}

export function createValidators(type: UriInputType, modelProvider: () => Model) {

  const result: IModelValidators = {};

  if (type === 'stem') {
    result['stem'] = isValidUriStem;
  } else if (type === 'free-url') {
    result['xsd:anyURI'] = isValidUri;
    result['url'] = value => !value || !isValidUri(value) || isValidUrl(value);
  } else if (type === 'free-uri') {
    result['xsd:anyURI'] = isValidUri;
  } else {
    result['xsd:anyURI'] = isValidUri;
    result['unknownNS'] = value => !value || !isValidUri(value) || value.namespaceResolves();
    result['idNameRequired'] = value => !value || !isValidUri(value) || !value.namespaceResolves() || value.name.length > 0;

    if (type === 'required-namespace') {
      result['mustBeRequiredNS'] = value =>  !value || !isValidUri(value) || !value.namespaceResolves() || modelProvider().isRequiredNamespace(value.namespace);
    }
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
          element.attr('placeholder', placeholderText(attributes.uriInput, gettextCatalog));
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
