import { Localizable, LanguageContext } from './entities';
import { Language, availableUILanguages, availableLanguages, translate } from '../utils/language';

const defaultLanguage: Language = 'fi';

const fi = require('../../po/fi.po');
const en = require('../../po/en.po');

const modelLanguageKey = 'modelLanguage';
const uiLanguageKey = 'UILanguage';

export class LanguageService {

  private _modelLanguage: {[entityId: string]: Language} = {};

  /* @ngInject */
  constructor(private gettextCatalog: any) {
    gettextCatalog.setStrings('fi', fi);
    gettextCatalog.setStrings('en', en);

    this.setGettextLanguage(window.sessionStorage.getItem(uiLanguageKey) || defaultLanguage);
    const storedModelLanguage = window.sessionStorage.getItem(modelLanguageKey);
    this._modelLanguage = storedModelLanguage ? JSON.parse(storedModelLanguage) : {};
  }

  private setGettextLanguage(language: Language): void {
    this.gettextCatalog.setCurrentLanguage(language);
  }

  get UILanguage(): Language {
    return this.gettextCatalog.getCurrentLanguage();
  }

  set UILanguage(language: Language) {
    window.sessionStorage.setItem(uiLanguageKey, language);
    this.setGettextLanguage(language);
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
    window.sessionStorage.setItem(modelLanguageKey, JSON.stringify(this._modelLanguage));
  }

  get availableUILanguages() {
    return availableUILanguages;
  }

  translate(data: Localizable, context?: LanguageContext): string {
    return translate(data, this.getModelLanguage(context), context ? context.language : availableLanguages);
  }

  createLocalizer(context: LanguageContext) {
    return new Localizer(this, context);
  }
}

export class Localizer {
  constructor(private languageService: LanguageService, private context: LanguageContext) {
  }

  translate(data: Localizable): string {
    return this.languageService.translate(data, this.context);
  }
}
