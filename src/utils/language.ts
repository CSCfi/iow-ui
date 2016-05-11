import { Localizable } from '../services/entities';
import { hasValue } from './object';

export type Language = string;

// language codes according to ISO_639-1 specification
export const availableLanguages: Language[] =
  [ 'ab', 'aa', 'af', 'ak', 'sq', 'am', 'ar', 'an', 'hy', 'as', 'av', 'ae', 'ay',
    'az', 'bm', 'ba', 'eu', 'be', 'bn', 'bh', 'bi', 'bs', 'br', 'bg', 'my', 'ca',
    'ch', 'ce', 'ny', 'zh', 'cv', 'kw', 'co', 'cr', 'hr', 'cs', 'da', 'dv', 'nl',
    'dz', 'en', 'eo', 'et', 'ee', 'fo', 'fj', 'fi', 'fr', 'ff', 'gl', 'ka', 'de',
    'el', 'gn', 'gu', 'ht', 'ha', 'he', 'hz', 'hi', 'ho', 'hu', 'ia', 'id', 'ie',
    'ga', 'ig', 'ik', 'io', 'is', 'it', 'iu', 'ja', 'jv', 'kl', 'kn', 'kr', 'ks',
    'kk', 'km', 'ki', 'rw', 'ky', 'kv', 'kg', 'ko', 'ku', 'kj', 'la', 'lb', 'lg',
    'li', 'ln', 'lo', 'lt', 'lu', 'lv', 'gv', 'mk', 'mg', 'ms', 'ml', 'mt', 'te',
    'mr', 'mh', 'mn', 'na', 'nv', 'nd', 'ne', 'ng', 'nb', 'nn', 'no', 'ii', 'nr',
    'oc', 'oj', 'cu', 'om', 'or', 'os', 'pa', 'pi', 'fa', 'pl', 'ps', 'pt', 'qu',
    'rm', 'rn', 'ro', 'ru', 'sa', 'sc', 'sd', 'se', 'sm', 'sg', 'sr', 'gd', 'sn',
    'si', 'sk', 'sl', 'af', 'st', 'es', 'su', 'sw', 'ss', 'sv', 'ta', 'te', 'tg',
    'th', 'ti', 'bo', 'tk', 'tl', 'tn', 'to', 'tr', 'ts', 'tt', 'tw', 'ty', 'ug',
    'uk', 'ur', 'uz', 've', 'vi', 'vo', 'wa', 'cy', 'wo', 'fy', 'xh', 'yi', 'yo',
    'za', 'zu' ];

export const availableUILanguages: Language[] = ['fi', 'en'];


export function translate(data: Localizable, language: Language, languages?: Language[]): string {
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

  if (!data || Object.keys(data).length === 0) {
    return '';
  }

  return localized(language, false) || _.find(_.map(languages || availableLanguages, lang => localized(lang, true)), _.identity) || localized(Object.keys(data)[0], true);
}

export function isLocalizationDefined(localizationKey: string, localized: string) {
  return localized.indexOf('[MISSING]') === -1 && localized !== localizationKey;
}


export function allLocalizations(predicate: (localized: string) => boolean, localizable: Localizable) {
  if (localizable) {
    for (let localized of Object.values(localizable)) {
      if (!predicate(localized)) {
        return false;
      }
    }
  }
  return true;
}

export function anyLocalization(predicate: (localized: string) => boolean, localizable: Localizable) {
  if (localizable) {
    for (let localized of Object.values(localizable)) {
      if (predicate(localized)) {
        return true;
      }
    }
  }
  return false;
}

export function hasLocalization(localizable: Localizable) {
  return !!localizable && hasValue(localizable);
}

