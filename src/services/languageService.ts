import * as _ from 'lodash';
import { Localizable } from './entities';

const languages: Language[] = ['fi', 'en'];
const defaultLanguage: Language = 'fi';

const fi = require('../../po/fi.po');
const en = require('../../po/en.po');

export type Language = string;

export class LanguageService {

  modelLanguage: Language = defaultLanguage;

  /* @ngInject */
  constructor(private gettextCatalog: any) {
    gettextCatalog.setStrings('fi', fi);
    gettextCatalog.setStrings('en', en);
    this.setGettextLanguage(defaultLanguage);
  }

  private setGettextLanguage(language: Language): void {
    this.gettextCatalog.setCurrentLanguage(language);
  }

  get UILanguage(): Language {
    return this.gettextCatalog.getCurrentLanguage();
  }

  set UILanguage(language: Language) {
    this.setGettextLanguage(language);
  }

  get availableLanguages() {
    return languages;
  }

  translate(data: Localizable): string {
    return translate(data, this.modelLanguage);
  }
}

export function translate(data: Localizable, language: Language): string {
  function localized(lang: Language, showLang: boolean): string {
    let localization = data[lang];

    if (Array.isArray(localization)) {
      localization = Array.join(localization, ' ');
    }

    if (!localization) {
      return '';
    } else {
      return localization + (showLang ? ` (${lang})` : '');
    }
  }

  if (!data) {
    return '';
  }

  return localized(language, false) || _.find(_.map(languages, lang => localized(lang, true)), _.identity) || '';
}
