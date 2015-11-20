import IScope = angular.IScope;
import {LanguageService, Language} from "../../services/languageService";

export const mod = angular.module('iow.components.navigation');

mod.directive('globalLanguageChooser', () => {
  'ngInject';
  return {
    scope: {
    },
    restrict: 'E',
    template: require('./globalLanguageChooser.html'),
    bindToController: true,
    controllerAs: 'ctrl',
    controller: GlobalLanguageChooserController
  };
});

class GlobalLanguageChooserController {

  currentLanguage: Language;
  languages: Language[];

  /* @ngInject */
  constructor(private languageService: LanguageService) {
    this.currentLanguage = languageService.UILanguage;
    this.languages = languageService.availableLanguages;
  }

  setLanguage(language: Language) {
    this.languageService.UILanguage = language;
    this.languageService.modelLanguage = language;
  }
}
