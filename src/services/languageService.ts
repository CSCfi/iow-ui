import { Localizable } from './entities';
import { Language } from '../components/contracts';
import { availableUILanguages, translate } from './utils';

const defaultLanguage: Language = 'fi';

const fi = require('../../po/fi.po');
const en = require('../../po/en.po');

const modelLanguageKey = 'modelLanguage';
const uiLanguageKey = 'UILanguage';

export class LanguageService {

  private _modelLanguage: Language;

  /* @ngInject */
  constructor(private gettextCatalog: any) {
    gettextCatalog.setStrings('fi', fi);
    gettextCatalog.setStrings('en', en);

    this.setGettextLanguage(window.sessionStorage.getItem(uiLanguageKey) || defaultLanguage);
    this.modelLanguage = window.sessionStorage.getItem(modelLanguageKey) || defaultLanguage;
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

  get modelLanguage(): Language {
    return this._modelLanguage;
  }

  set modelLanguage(language: Language) {
    window.sessionStorage.setItem(modelLanguageKey, language);
    this._modelLanguage = language;
  }

  get availableUILanguages() {
    return availableUILanguages;
  }

  translate(data: Localizable): string {
    return translate(data, this.modelLanguage);
  }
}
