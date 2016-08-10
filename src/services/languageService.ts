import { Localizable, LanguageContext } from './entities';
import { Language, availableUILanguages, availableLanguages, translate, UILanguage } from '../utils/language';
import { SessionService } from './sessionService';
import gettextCatalog = angular.gettext.gettextCatalog;

const defaultLanguage: Language = 'fi';

export const localizationStrings: { [key: string]: { [key: string]: string } } = {};

for (const language of availableUILanguages) {
  localizationStrings[language] = require(`../../po/${language}.po`);
}

Object.freeze(localizationStrings);

export class LanguageService {

  private _modelLanguage: {[entityId: string]: Language} = {};

  /* @ngInject */
  constructor(private gettextCatalog: gettextCatalog, private sessionService: SessionService) {

    for (const language of availableUILanguages) {
      gettextCatalog.setStrings(language, localizationStrings[language]);
    }

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
    if (context) {
      const key = context.id.uri;
      const language = this._modelLanguage[key];
      return language ? language : context.language[0];
    } else {
      return this.UILanguage;
    }
  }

  setModelLanguage(context: LanguageContext, language: Language) {
    this._modelLanguage[context.id.uri] = language;
    this.sessionService.modelLanguage = this._modelLanguage;
  }

  translate(data: Localizable, context?: LanguageContext): string {
    return translate(data, this.getModelLanguage(context), context ? context.language : availableLanguages);
  }

  createLocalizer(context: LanguageContext) {
    return new Localizer(this, context);
  }
}

export class Localizer {
  constructor(private languageService: LanguageService, public context: LanguageContext) {
  }

  get language(): Language {
    return this.languageService.getModelLanguage(this.context);
  }

  translate(data: Localizable): string {
    return this.languageService.translate(data, this.context);
  }
}
