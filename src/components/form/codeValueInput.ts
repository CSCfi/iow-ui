import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import gettextCatalog = angular.gettext.gettextCatalog;
import INgModelController = angular.INgModelController;
import IModelFormatter = angular.IModelFormatter;
import { ModelService } from '../../services/modelService';
import { module as mod }  from './module';
import { LanguageService } from '../../services/languageService';
import { CodeScheme } from '../../services/entities';
import IPromise = angular.IPromise;
import IQService = angular.IQService;
import IModelValidators = angular.IModelValidators;
import IAsyncModelValidators = angular.IAsyncModelValidators;

export function placeholderText(gettextCatalog: gettextCatalog) {
  return gettextCatalog.getString('Write code');
}

export function createAsyncValidators($q: IQService, codeScheme: CodeScheme, modelService: ModelService): IAsyncModelValidators {

    const codeValues = codeScheme ? modelService.getCodeValues(codeScheme) : $q.when([]);

    return {
      codeValue(codeValue: string) {

        if (!codeScheme || !codeValue) {
          return $q.resolve();
        } else {
          return codeValues.then(values => {
            for (const value of values) {
              if (value.identifier === codeValue) {
                return true;
              }
            }
            return $q.reject('does not match');
          });
        }
      }
    };
}

mod.directive('codeValueInput', /* @ngInject */ ($q: IQService, modelService: ModelService, languageService: LanguageService, gettextCatalog: gettextCatalog) => {
  return {
    scope: {
      codeScheme: '='
    },
    restrict: 'A',
    require: 'ngModel',
    link($scope: CodeValueInputScope, element: JQuery, attributes: IAttributes, modelController: INgModelController) {

      if (!attributes['placeholder']) {
        $scope.$watch(() => languageService.UILanguage, () => {
          element.attr('placeholder', placeholderText(gettextCatalog));
        });
      }

      $scope.$watch(() => $scope.codeScheme, codeScheme => {
        Object.assign(modelController.$asyncValidators, createAsyncValidators($q, codeScheme, modelService));
      });
    }
  };
});

interface CodeValueInputScope extends IScope {
  codeScheme: CodeScheme;
}
