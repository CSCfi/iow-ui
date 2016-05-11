import IScope = angular.IScope;
import gettextCatalog = angular.gettext.gettextCatalog;
import { Language } from '../contracts';
import { module as mod }  from './module';

mod.directive('editableMultipleLanguageSelect', () => {
  return {
    scope: {
      ngModel: '=',
      id: '@',
      title: '@'
    },
    restrict: 'E',
    controllerAs: 'ctrl',
    bindToController: true,
    template: `
      <editable-multiple id="{{ctrl.id}}" data-title="{{ctrl.title}}" ng-model="ctrl.ngModel" required="true" input="ctrl.input">
        <input-container>
          <input id="{{ctrl.id}}"
                 type="text"
                 restrict-duplicates="ctrl.ngModel"
                 language-input
                 ng-model="ctrl.input" />
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
}
