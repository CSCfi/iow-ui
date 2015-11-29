import IScope = angular.IScope;
import { LanguageService, Language } from '../../services/languageService';

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

  languages: Language[];

  /* @ngInject */
  constructor(private languageService: LanguageService) {
    this.languages = languageService.availableLanguages;
  }

  get language(): Language {
    return this.languageService.UILanguage;
  }

  set language(language: Language) {
    this.languageService.UILanguage = language;
    this.languageService.modelLanguage = language;
  }
}
