import { Localizable, LanguageContext } from './entities';
import {
  Language, availableUILanguages, translate, UILanguage,
  Localizer
} from '../utils/language';
export { Localizer } from '../utils/language';
import { SessionService } from './sessionService';
import gettextCatalog = angular.gettext.gettextCatalog;

export const localizationStrings: { [key: string]: { [key: string]: string } } = {};

for (const language of availableUILanguages) {
  localizationStrings[language] = require(`../../po/${language}.po`);
}

Object.freeze(localizationStrings);

function findLocalization(key: string, language: Language) {
  const stringsForLang = localizationStrings[language];
  return stringsForLang ? stringsForLang[key] : null;
}

export class LanguageService {

  private _modelLanguage: {[entityId: string]: Language} = {};

  /* @ngInject */
  constructor(private gettextCatalog: gettextCatalog, private sessionService: SessionService) {

    for (const language of availableUILanguages) {
      gettextCatalog.setStrings(language, localizationStrings[language]);
    }

    const defaultLanguage = 'fi';
    this.gettextCatalog.setCurrentLanguage(sessionService.UILanguage || defaultLanguage);
    this._modelLanguage = sessionService.modelLanguage || {};
  }

  get UILanguage(): UILanguage {
    return <UILanguage> this.gettextCatalog.getCurrentLanguage();
  }

  set UILanguage(language: UILanguage) {
    this.sessionService.UILanguage = language;
    this.gettextCatalog.setCurrentLanguage(language);
  }

  getModelLanguage(context?: LanguageContext): Language {

    const getUILanguageOrFirst = () => {
      if (context!.language.indexOf(this.UILanguage) !== -1) {
        return this.UILanguage;
      } else {
        return context!.language[0];
      }
    };

    if (context) {
      const key = context.id.uri;
      const language = this._modelLanguage[key];
      return language ? language : getUILanguageOrFirst();
    } else {
      return this.UILanguage;
    }
  }

  setModelLanguage(context: LanguageContext, language: Language) {
    this._modelLanguage[context.id.uri] = language;
    this.sessionService.modelLanguage = this._modelLanguage;
  }

  translate(data: Localizable, context?: LanguageContext): string {
    return translate(data, this.getModelLanguage(context), context ? context.language : availableUILanguages);
  }

  createLocalizer(context: LanguageContext) {
    return new DefaultLocalizer(this, context);
  }
}

export class DefaultLocalizer implements Localizer {
  constructor(private languageService: LanguageService, public context: LanguageContext) {
  }

  get language(): Language {
    return this.languageService.getModelLanguage(this.context);
  }

  translate(data: Localizable): string {
    return this.languageService.translate(data, this.context);
  }

  getStringWithModelLanguageOrDefault(key: string, defaultLanguage: UILanguage): string {

    const askedLocalization = findLocalization(key, this.language);
    if (askedLocalization) {
      return askedLocalization;
    } else {
      const defaultLocalization = findLocalization(key, defaultLanguage);

      if (!defaultLocalization) {
        console.log(`Localization (${key}) not found for default language (${defaultLanguage})`);
        return '??? ' + key;
      } else {
        return defaultLocalization;
      }
    }
  }
}
