import IAttributes = angular.IAttributes;
import IAsyncModelValidators = angular.IAsyncModelValidators;
import IModelValidators = angular.IModelValidators;
import IPromise = angular.IPromise;
import IQService = angular.IQService;
import IScope = angular.IScope;
import gettextCatalog = angular.gettext.gettextCatalog;
import INgModelController = angular.INgModelController;
import IModelFormatter = angular.IModelFormatter;
import { ModelService } from '../../services/modelService';
import { LanguageService } from '../../services/languageService';
import { ReferenceData, ReferenceDataCode } from '../../services/entities';
import { module as mod }  from './module';

export function placeholderText(gettextCatalog: gettextCatalog) {
  return gettextCatalog.getString('Write reference data code');
}

export function createAsyncValidators($q: IQService, referenceData: ReferenceData, modelService: ModelService): IAsyncModelValidators {

    const codes: IPromise<ReferenceDataCode[]> = referenceData && !referenceData.isExternal() ? modelService.getReferenceDataCodes(referenceData) : $q.when([]);

    return {
      codeValue(codeValue: string) {

        if (!referenceData || referenceData.isExternal() || !codeValue) {
          return $q.resolve();
        } else {
          return codes.then(values => {
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
      referenceData: '='
    },
    restrict: 'A',
    require: 'ngModel',
    link($scope: CodeValueInputScope, element: JQuery, attributes: IAttributes, modelController: INgModelController) {

      if (!attributes['placeholder']) {
        $scope.$watch(() => languageService.UILanguage, () => {
          element.attr('placeholder', placeholderText(gettextCatalog));
        });
      }

      $scope.$watch(() => $scope.referenceData, referenceData => {
        Object.assign(modelController.$asyncValidators, createAsyncValidators($q, referenceData, modelService));
      });
    }
  };
});

interface CodeValueInputScope extends IScope {
  referenceData: ReferenceData;
}
