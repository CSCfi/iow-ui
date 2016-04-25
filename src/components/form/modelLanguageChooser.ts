import IScope = angular.IScope;
import gettextCatalog = angular.gettext.gettextCatalog;
import { LanguageService } from '../../services/languageService';
import { Language } from '../contracts';
import { isLocalizationDefined } from '../../services/utils';
import { module as mod }  from './module';

mod.directive('modelLanguageChooser', () => {
  return {
    scope: {
      languages: '='
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
  constructor($scope: IScope, private languageService: LanguageService, private gettextCatalog: gettextCatalog) {
    $scope.$watchCollection(() => this.languages, languages => {
      if (languages && languages.indexOf(languageService.modelLanguage) === -1) {
        languageService.modelLanguage = languages[0];
      }
    });

    $scope.$watch(() => languageService.UILanguage, language => {
      if (this.languages && this.languages.indexOf(language) !== -1) {
        this.languageService.modelLanguage = language;
      }
    });
  }

  localizeLanguageName(language: Language) {
    const key = 'data ' + language;
    const localization = this.gettextCatalog.getString(key);

    if (isLocalizationDefined(key, localization)) {
      return localization;
    } else {
      return this.gettextCatalog.getString('data language') + ': ' + language;
    }
  }

  get language(): Language {
    return this.languageService.modelLanguage;
  }

  set language(language: Language) {
    this.languageService.modelLanguage = language;
  }
}
