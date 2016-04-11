import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import IQService = angular.IQService;
import gettextCatalog = angular.gettext.gettextCatalog;
import { Model } from '../../services/entities';
import { isValidUri, isValidUrl } from './validators';
import { Uri } from '../../services/uri';

import { module as mod }  from './module';

type UriInputType = 'required-namespace' | 'free-url';

interface UriInputAttributes extends IAttributes {
  uriInput: UriInputType;
}

mod.directive('uriInput', /* @ngInject */ (gettextCatalog: gettextCatalog) => {
  return {
    scope: {
      model: '='
    },
    restrict: 'A',
    require: 'ngModel',
    link($scope: UriInputScope, element: JQuery, attributes: UriInputAttributes, modelController: INgModelController) {

      if (!attributes['placeholder']) {
        element.attr('placeholder', gettextCatalog.getString('Write identifier'));
      }

      modelController.$parsers.push((viewValue: string) => {
        return viewValue === '' ? null : new Uri(viewValue, $scope.model.context);
      });

      modelController.$formatters.push((value: Uri) => {
        if (!value) {
          return '';
        } else {
          return value.compact;
        }
      });

      modelController.$validators['xsd:anyURI'] = isValidUri;

      if (attributes.uriInput === 'free-url') {
        modelController.$validators['url'] = value => {
          return !value || !isValidUri(value) || isValidUrl(value);
        };
      } else {
        if (attributes.uriInput === 'required-namespace') {
          modelController.$validators['mustBeRequiredNS'] = value => {
            function isRequiredNamespace(ns: string) {
              for (const require of $scope.model.requires) {
                if (ns === require.namespace) {
                  return true;
                }
              }
              return false;
            }

            return !value || !isValidUri(value) || !value.hasResolvablePrefix() || isRequiredNamespace(value.namespace);
          };
        }
        modelController.$validators['unknownNS'] = value => {
          return !value || !isValidUri(value) || value.hasResolvablePrefix();
        };

        modelController.$validators['idNameRequired'] = value => {
          return !value || !isValidUri(value) || !value.hasResolvablePrefix() || value.name.length > 0;
        };
      }
    }
  };
});

interface UriInputScope extends IScope {
  model: Model;
}
