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
import { ReferenceData } from '../../services/entities';
import { module as mod }  from './module';
import { any } from '../../utils/array';

export function placeholderText(gettextCatalog: gettextCatalog) {
  return gettextCatalog.getString('Write reference data code');
}

export function createAsyncValidators($q: IQService, referenceData: ReferenceData[], modelService: ModelService): IAsyncModelValidators {

  const hasExternalReferenceData = any(referenceData, rd => rd.isExternal());

  return {
    codeValue(codeValue: string) {

      if (referenceData.length === 0 || hasExternalReferenceData || !codeValue) {
        return $q.resolve();
      } else {
        return modelService.getReferenceDataCodes(referenceData).then(values => {
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
  referenceData: ReferenceData[];
}
