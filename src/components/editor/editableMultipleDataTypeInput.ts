import IAttributes = angular.IAttributes;
import IFormController = angular.IFormController;
import INgModelController = angular.INgModelController;
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import gettextCatalog = angular.gettext.gettextCatalog;
import IModelValidators = angular.IModelValidators;
import { DataType } from '../../services/dataTypes';
import { module as mod }  from './module';
import { ReferenceData, LanguageContext } from '../../services/entities';

mod.directive('editableMultipleDataTypeInput', () => {
  return {
    scope: {
      ngModel: '=',
      inputType: '=',
      id: '@',
      title: '@',
      referenceData: '=',
      context: '='
    },
    restrict: 'E',
    controllerAs: 'ctrl',
    bindToController: true,
    template: `
      <editable-multiple id="{{ctrl.id}}" data-title="{{ctrl.title}}" ng-model="ctrl.ngModel" input="ctrl.input">
        <input-container>
          <code-value-input-autocomplete reference-data="ctrl.referenceData" context="ctrl.context">
            <input id="{{ctrl.id}}"
                   type="text"
                   restrict-duplicates="ctrl.ngModel"
                   datatype-input="ctrl.inputType"
                   reference-data="ctrl.referenceData"
                   ng-model="ctrl.input" />
          </code-value-input-autocomplete>
        </input-container>
      </editable-multiple>
    `,
    controller: EditableMultipleDataTypeInputController
  };
});

class EditableMultipleDataTypeInputController {

  ngModel: string[];
  input: string;
  inputType: DataType;
  id: string;
  title: string;
  referenceData: ReferenceData;
  context: LanguageContext;
}
