import IAttributes = angular.IAttributes;
import IFormController = angular.IFormController;
import INgModelController = angular.INgModelController;
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import gettextCatalog = angular.gettext.gettextCatalog;
import IModelValidators = angular.IModelValidators;
import { module as mod }  from './module';
import { isValidLanguageCode } from '../form/validators';
import { Language } from '../contracts';
import IModelParser = angular.IModelParser;
import IModelFormatter = angular.IModelFormatter;

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
                                  parser="ctrl.parser" 
                                  formatter="ctrl.formatter"
                                  required="true"
              </editable-multiple>`,
    controller: EditableMultipleLanguageSelectController
  };
});

class EditableMultipleLanguageSelectController {

  ngModel: Language[];
  id: string;
  title: string;

  validators: IModelValidators;
  placeholder: string;
  parser: IModelParser;
  formatter: IModelFormatter;

  /* @ngInject */
  constructor(gettextCatalog: gettextCatalog) {
    this.validators = { languageCode: isValidLanguageCode };
    this.placeholder = gettextCatalog.getString('Input') + ' ' + gettextCatalog.getString('language code') + '...';
    this.formatter = value => value;
    this.parser = value => value;
  }
}
