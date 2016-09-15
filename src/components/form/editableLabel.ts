import { IAttributes, IScope, ITimeoutService } from 'angular';
import gettextCatalog = angular.gettext.gettextCatalog;
import { EditableForm } from './editableEntityController';
import { LanguageService } from '../../services/languageService';
import { isLocalizationDefined } from '../../utils/language';
import { module as mod }  from './module';

const clipboardImage = require('../../assets/clippy.svg');

mod.directive('editableLabel', () => {
  return {
    scope: {
      title: '=',
      inputId: '=',
      required: '=',
      clipboard: '='
    },
    restrict: 'E',
    template: `<label>{{ctrl.title | translate}} 
                  <span ng-show="ctrl.infoText" class="fa fa-info-circle info" uib-tooltip="{{ctrl.infoText}}"></span>
                  <span ng-show="ctrl.required && ctrl.isEditing()" class="fa fa-asterisk" style="color: red; font-size: small" uib-tooltip="{{'Required' | translate}}"></span>
                  <img ng-src="{{ctrl.clipboardImage}}" class="svg-icon"
                       ng-if="ctrl.clipboard && !ctrl.isEditing()" 
                       uib-tooltip="{{ctrl.copyInfo}}"
                       uib-popover="{{'Copied' | translate}}"
                       popover-is-open="ctrl.showCopiedMessage"
                       popover-trigger="none"
                       ngclipboard 
                       ngclipboard-success="ctrl.onCopy()"
                       data-clipboard-text="{{ctrl.clipboard}}">
                  </img>
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
  clipboard: string;
  showCopiedMessage = false;
  clipboardImage = clipboardImage;

  /* @ngInject */
  constructor($scope: IScope, private $timeout: ITimeoutService, private gettextCatalog: gettextCatalog, languageService: LanguageService) {
    const key = this.title + ' info';
    $scope.$watch(() => languageService.UILanguage, () => {
      const infoText = gettextCatalog.getString(key);
      this.infoText = isLocalizationDefined(key, infoText) ? infoText : '';
    });
  }

  get copyInfo() {
    return this.gettextCatalog.getString('Copy "{{text}}" to clipboard', { text: this.clipboard });
  }

  onCopy() {
    this.showCopiedMessage = true;
    this.$timeout(() => this.showCopiedMessage = false, 2000);
  }
}
