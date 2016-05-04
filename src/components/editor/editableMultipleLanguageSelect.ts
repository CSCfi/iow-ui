import IScope = angular.IScope;
import gettextCatalog = angular.gettext.gettextCatalog;
import { Language } from '../contracts';
import { LanguageService } from '../../services/languageService';
import { module as mod }  from './module';
import { isValidLanguageCode } from '../form/validators';

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
    template: `<editable-multiple id="{{ctrl.id}}" 
                                  data-title="{{ctrl.title}}" 
                                  ng-model="ctrl.ngModel" 
                                  validators="ctrl.validators" 
                                  placeholder="ctrl.placeholder"
                                  required="true"
              </editable-multiple>`,
    controller: EditableMultipleLanguageSelectController
  };
});

class EditableMultipleLanguageSelectController {

  ngModel: Language[];
  id: string;
  title: string;

  validators = { languageCode: isValidLanguageCode };
  placeholder: string;

  /* @ngInject */
  constructor($scope: IScope, languageService: LanguageService, gettextCatalog: gettextCatalog) {
    $scope.$watch(() => languageService.UILanguage, () => {
      this.placeholder = gettextCatalog.getString('Input') + ' ' + gettextCatalog.getString('language code') + '...';
    });
  }
}
