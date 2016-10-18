import { IQService } from 'angular';
import { Language, availableLanguages } from '../../utils/language';
import { module as mod }  from './module';

mod.directive('editableMultipleLanguageSelect', () => {
  return {
    scope: {
      ngModel: '=',
      id: '@',
      title: '@',
      required: '='
    },
    restrict: 'E',
    controllerAs: 'ctrl',
    bindToController: true,
    template: `
      <editable-multiple id="{{ctrl.id}}" data-title="{{ctrl.title}}" ng-model="ctrl.ngModel" required="ctrl.required" input="ctrl.input">
        <input-container>
          <autocomplete datasource="ctrl.datasource">
            <input id="{{ctrl.id}}"
                   type="text"
                   restrict-duplicates="ctrl.ngModel"
                   language-input
                   ignore-form
                   autocomplete="false"
                   ng-model="ctrl.input" />
          </autocomplete>
        </input-container>
      </editable-multiple>
    `,
    controller: EditableMultipleLanguageSelectController
  };
});

class EditableMultipleLanguageSelectController {

  ngModel: Language[];
  input: Language;
  id: string;
  title: string;

  constructor(private $q: IQService) {
  }

  datasource = (_search: string) => this.$q.when(availableLanguages);
}
