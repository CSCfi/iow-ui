import IScope = angular.IScope;
import { LanguageService, Language } from '../../services/languageService';

export const mod = angular.module('iow.components.form');

mod.directive('modelLanguageChooser', () => {
  'ngInject';
  return {
    scope: {
    },
    restrict: 'E',
    template: require('./modelLanguageChooser.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    controller: ModelLanguageChooserController
  };
});

class ModelLanguageChooserController {

  currentLanguage: Language;
  languages: Language[];

  /* @ngInject */
  constructor(private languageService: LanguageService) {
    this.currentLanguage = languageService.modelLanguage;
    this.languages = languageService.availableLanguages;
  }

  setLanguage(language: Language) {
    this.languageService.modelLanguage = language;
  }
}
