import { Localizable } from './entities';
import { Language } from '../components/contracts';
import { availableLanguages, translate } from './utils';

const defaultLanguage: Language = 'fi';

const fi = require('../../po/fi.po');
const en = require('../../po/en.po');

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
    return availableLanguages;
  }

  translate(data: Localizable): string {
    return translate(data, this.modelLanguage);
  }
}
