import { IAttributes, IScope, IQService, INgModelController } from 'angular';
import gettextCatalog = angular.gettext.gettextCatalog;
import { DataType } from '../../services/dataTypes';
import { resolveValidator } from './validators';
import { LanguageService } from '../../services/languageService';
import { createAsyncValidators } from './codeValueInput';
import { ReferenceData } from '../../services/entities';
import { ModelService } from '../../services/modelService';
import { isUpperCase } from 'change-case';
import { module as mod }  from './module';

export function placeholderText(dataType: DataType, gettextCatalog: gettextCatalog) {
  const validator = resolveValidator(dataType);
  const localization = gettextCatalog.getString(dataType);
  const placeholder = gettextCatalog.getString('Input') + ' ' + (isUpperCase(localization) ? localization : localization.toLowerCase()) + '...';
  return validator.format ? placeholder + ` (${validator.format})` : placeholder;
};

interface DatatypeInputScope extends IScope {
  datatypeInput: DataType;
  referenceData: ReferenceData[];
}

mod.directive('datatypeInput', /* @ngInject */ ($q: IQService, modelService: ModelService, languageService: LanguageService, gettextCatalog: gettextCatalog) => {
  return {
    restrict: 'EA',
    scope: {
      datatypeInput: '=',
      referenceData: '='
    },
    require: 'ngModel',
    link($scope: DatatypeInputScope, element: JQuery, _attributes: IAttributes, ngModel: INgModelController) {

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

      function initializeReferenceData(referenceData: ReferenceData[]) {
        Object.assign(ngModel.$asyncValidators, createAsyncValidators($q, referenceData, modelService));
        ngModel.$validate();
      }

      $scope.$watch(() => $scope.datatypeInput, initializeDataType);
      $scope.$watchCollection(() => $scope.referenceData, initializeReferenceData);
    }
  };
});
