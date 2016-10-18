import { module as mod }  from './module';
import { DataType } from '../../entities/dataTypes';
import { ReferenceData } from '../../entities/referenceData';
import { LanguageContext } from '../../entities/contract';

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
                   ignore-form
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
