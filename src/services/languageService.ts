import * as _  from 'lodash';
import { Localizable } from './entities';

const languages: Language[] = ['fi', 'en'];
const defaultLanguage: Language = 'fi';

export type Language = string;

export class LanguageService {

  modelLanguage: Language = defaultLanguage;

  constructor(private gettextCatalog: any) {
    'ngInject';
    this.setGettextLanguage(defaultLanguage);
  }

  private setGettextLanguage(language: Language): void {
    this.gettextCatalog.setCurrentLanguage(language);
    this.gettextCatalog.loadRemote(`translations/${language}.json`);
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
    function localized(lang: Language, showLang: boolean): string {
      let localization = data[lang];

      if (Array.isArray(localization)) {
        // TODO array of localizations
        localization = localization[0];
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

    return localized(this.modelLanguage, false) || _.find(_.map(languages, lang => localized(lang, true)), _.identity) || '';
  }
}
