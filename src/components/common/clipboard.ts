import { module as mod } from './module';
import { IScope, IAttributes, ITimeoutService } from 'angular';
import { EditableForm } from '../form/editableEntityController';
import gettextCatalog = angular.gettext.gettextCatalog;

const clipboardImage = require('../../assets/clippy.svg');

mod.directive('clipboard', () => {
  return {
    scope: {
      text: '='
    },
    restrict: 'E',
    bindToController: true,
    controllerAs: 'ctrl',
    controller: ClipboardController,
    template: `<img ng-src="{{ctrl.clipboardImage}}" class="svg-icon"
                   ng-if="ctrl.text && !ctrl.isEditing()" 
                   uib-tooltip="{{ctrl.copyInfo}}"
                   uib-popover="{{'Copied' | translate}}"
                   popover-is-open="ctrl.showCopiedMessage"
                   popover-trigger="none"
                   ngclipboard 
                   ngclipboard-success="ctrl.onCopy()"
                   data-clipboard-text="{{ctrl.text}}">
              </img>`,
    require: ['clipboard', '?^form'],
    link(_$scope: IScope, _element: JQuery, _attibutes: IAttributes, [thisController, formController]: [ClipboardController, EditableForm]) {
      thisController.isEditing = () => formController.editing;
    }
  };
});

class ClipboardController {

  text: string;
  showCopiedMessage = false;
  clipboardImage = clipboardImage;
  isEditing: () => boolean;

  /* @ngInject */
  constructor(private gettextCatalog: gettextCatalog, private $timeout: ITimeoutService) {
  }

  get copyInfo() {
    return this.gettextCatalog.getString('Copy "{{text}}" to clipboard', { text: this.text });
  }

  onCopy() {
    this.showCopiedMessage = true;
    this.$timeout(() => this.showCopiedMessage = false, 2000);
  }
}
