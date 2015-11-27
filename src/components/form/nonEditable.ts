import ILocationService = angular.ILocationService;
import gettextCatalog = angular.gettext.gettextCatalog;
import { Localizable, isLocalizable } from '../../services/entities';
import { isString } from '../../services/utils';
import { LanguageService } from '../../services/languageService';

export const mod = angular.module('iow.components.form');

mod.directive('nonEditable', () => {
  'ngInject';
  return {
    scope: {
      title: '@',
      value: '=',
      link: '=',
      externalLink: '=',
      valueAsLocalizationKey: '@'
    },
    restrict: 'E',
    template: `<div ng-show="ctrl.value">
                 <div class="model-view__title">{{ctrl.title | translate}}</div>
                 <a ng-if="ctrl.link && ctrl.isDifferentUrl(ctrl.link)" ng-href="{{'#' + ctrl.link}}">{{ctrl.displayValue()}}</a>
                 <a ng-if="ctrl.externalLink" ng-href="{{ctrl.externalLink}}" target="_blank">{{ctrl.displayValue()}}</a>
                 <div ng-if="(!ctrl.link || !ctrl.isDifferentUrl(ctrl.link)) && !ctrl.externalLink">{{ctrl.displayValue()}}</div>
               </div>`,
    bindToController: true,
    controllerAs: 'ctrl',
    controller: NonEditableController
  };
});

// TODO copy paste with editable
// TODO proper view model
class NonEditableController {

  title: string;
  value: Localizable|string;
  link: string;
  externalLink: string;
  valueAsLocalizationKey: boolean;

  /* @ngInject */
  constructor(private $location: ILocationService, private languageService: LanguageService, private gettextCatalog: gettextCatalog) {
  }

  isDifferentUrl(url: string): boolean {
    return this.$location.url().replace(/:/g, '%3A') !== url;
  }

  displayValue(): string {
    const value = this.value;

    if (isLocalizable(value)) {
      return this.languageService.translate(value);
    } else if (isString(value)) {
      return value && this.valueAsLocalizationKey ? this.gettextCatalog.getString(value) : value;
    }
  };
}
