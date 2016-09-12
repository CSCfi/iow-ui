import { IScope } from 'angular';
import gettextCatalog = angular.gettext.gettextCatalog;
import { LanguageService } from '../../services/languageService';
import { LanguageContext } from '../../services/entities';
import { Language, isLocalizationDefined } from '../../utils/language';
import { module as mod }  from './module';

mod.directive('modelLanguageChooser', () => {
  return {
    scope: {
      context: '='
    },
    restrict: 'E',
    template: require('./modelLanguageChooser.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    controller: ModelLanguageChooserController
  };
});

class ModelLanguageChooserController {

  context: LanguageContext;

  /* @ngInject */
  constructor($scope: IScope, private languageService: LanguageService, private gettextCatalog: gettextCatalog) {
    $scope.$watchCollection(() => this.context && this.context.language, languages => {
      if (languages && languages.indexOf(languageService.getModelLanguage(this.context)) === -1) {
        languageService.setModelLanguage(this.context, this.context.language[0]);
      }
    });

    $scope.$watch(() => languageService.UILanguage, (language, previousLanguage) => {
      if (language !== previousLanguage) {
        if (this.context && this.context.language.indexOf(language) !== -1) {
          this.languageService.setModelLanguage(this.context, language);
        }
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
    return this.languageService.getModelLanguage(this.context);
  }

  set language(language: Language) {
    this.languageService.setModelLanguage(this.context, language);
  }
}
