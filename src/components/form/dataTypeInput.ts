import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import gettextCatalog = angular.gettext.gettextCatalog;
import IScope = angular.IScope;
import IQService = angular.IQService;
import { DataType } from '../../services/dataTypes';
import { resolveValidator } from './validators';
import { LanguageService } from '../../services/languageService';
import { createAsyncValidators } from './codeValueInput';
import { ReferenceData } from '../../services/entities';
import { ModelService } from '../../services/modelService';
import { module as mod }  from './module';

export function placeholderText(dataType: DataType, gettextCatalog: gettextCatalog) {
  const validator = resolveValidator(dataType);
  const placeholder = gettextCatalog.getString('Input') + ' ' + gettextCatalog.getString(dataType).toLowerCase() + '...';
  return validator.format ? placeholder + ` (${validator.format})` : placeholder;
};

interface DatatypeInputScope extends IScope {
  datatypeInput: DataType;
  codeScheme: ReferenceData;
}

mod.directive('datatypeInput', /* @ngInject */ ($q: IQService, modelService: ModelService, languageService: LanguageService, gettextCatalog: gettextCatalog) => {
  return {
    restrict: 'EA',
    scope: {
      datatypeInput: '=',
      codeScheme: '='
    },
    require: 'ngModel',
    link($scope: DatatypeInputScope, element: JQuery, attributes: IAttributes, ngModel: INgModelController) {

      const setPlaceholder = () => element.attr('placeholder', placeholderText($scope.datatypeInput, gettextCatalog));

      $scope.$watch(() => languageService.UILanguage, setPlaceholder);

      function initializeDataType(dataType: DataType, oldDataType: DataType) {
        setPlaceholder();

        if (oldDataType) {
          delete ngModel.$validators[oldDataType];
          ngModel.$setValidity(oldDataType, true);
        }

        ngModel.$validators[dataType] = resolveValidator(dataType);
        ngModel.$validate();
      }

      function initializeCodeScheme(codeScheme: ReferenceData) {
        Object.assign(ngModel.$asyncValidators, createAsyncValidators($q, codeScheme, modelService));
        ngModel.$validate();
      }

      $scope.$watch(() => $scope.datatypeInput, initializeDataType);
      $scope.$watch(() => $scope.codeScheme, initializeCodeScheme);
    }
  };
});
