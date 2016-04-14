import IScope = angular.IScope;
import { LanguageService } from '../../services/languageService';

import { module as mod }  from './module';
import { Language } from '../contracts';

mod.directive('modelLanguageChooser', () => {
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

  languages: Language[];

  /* @ngInject */
  constructor(private languageService: LanguageService) {
    this.languages = languageService.availableLanguages;
  }

  get language(): Language {
    return this.languageService.modelLanguage;
  }

  set language(language: Language) {
    this.languageService.modelLanguage = language;
  }
}
