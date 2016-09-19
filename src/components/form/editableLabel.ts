import { IAttributes, IScope } from 'angular';
import gettextCatalog = angular.gettext.gettextCatalog;
import { EditableForm } from './editableEntityController';
import { LanguageService } from '../../services/languageService';
import { isLocalizationDefined } from '../../utils/language';
import { module as mod }  from './module';

mod.directive('editableLabel', () => {
  return {
    scope: {
      title: '=',
      inputId: '=',
      required: '='
    },
    restrict: 'E',
    template: `<label>{{ctrl.title | translate}} 
                  <span ng-show="ctrl.infoText" class="fa fa-info-circle info" uib-tooltip="{{ctrl.infoText}}"></span>
                  <span ng-show="ctrl.required && ctrl.isEditing()" class="fa fa-asterisk" style="color: red; font-size: small" uib-tooltip="{{'Required' | translate}}"></span>
               </label>`,
    bindToController: true,
    controllerAs: 'ctrl',
    require: ['editableLabel', '?^form'],
    link($scope: IScope, element: JQuery, attributes: IAttributes, [thisController, formController]: [EditableLabelController, EditableForm]) {
      thisController.isEditing = () => formController.editing;
      const labelElement = element.find('label');
      $scope.$watch(() => thisController.inputId, inputId => {
        if (inputId) {
          labelElement.attr('for', inputId);
        }
      });
    },
    controller: EditableLabelController
  };
});

class EditableLabelController {

  title: string;
  inputId: string;
  isEditing: () => boolean;
  infoText: string;

  /* @ngInject */
  constructor($scope: IScope, private gettextCatalog: gettextCatalog, languageService: LanguageService) {
    const key = this.title + ' info';
    $scope.$watch(() => languageService.UILanguage, () => {
      const infoText = gettextCatalog.getString(key);
      this.infoText = isLocalizationDefined(key, infoText) ? infoText : '';
    });
  }
}
