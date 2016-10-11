import { hasValue } from './object';
import { LanguageContext, Localizable } from '../entities/contract';

export type Language = 'ab' | 'aa' | 'af' | 'ak' | 'sq' | 'am' | 'ar' | 'an' | 'hy' | 'as' | 'av' | 'ae' | 'ay'
                     | 'az' | 'bm' | 'ba' | 'eu' | 'be' | 'bn' | 'bh' | 'bi' | 'bs' | 'br' | 'bg' | 'my' | 'ca'
                     | 'ch' | 'ce' | 'ny' | 'zh' | 'cv' | 'kw' | 'co' | 'cr' | 'hr' | 'cs' | 'da' | 'dv' | 'nl'
                     | 'dz' | 'en' | 'eo' | 'et' | 'ee' | 'fo' | 'fj' | 'fi' | 'fr' | 'ff' | 'gl' | 'ka' | 'de'
                     | 'el' | 'gn' | 'gu' | 'ht' | 'ha' | 'he' | 'hz' | 'hi' | 'ho' | 'hu' | 'ia' | 'id' | 'ie'
                     | 'ga' | 'ig' | 'ik' | 'io' | 'is' | 'it' | 'iu' | 'ja' | 'jv' | 'kl' | 'kn' | 'kr' | 'ks'
                     | 'kk' | 'km' | 'ki' | 'rw' | 'ky' | 'kv' | 'kg' | 'ko' | 'ku' | 'kj' | 'la' | 'lb' | 'lg'
                     | 'li' | 'ln' | 'lo' | 'lt' | 'lu' | 'lv' | 'gv' | 'mk' | 'mg' | 'ms' | 'ml' | 'mt' | 'te'
                     | 'mr' | 'mh' | 'mn' | 'na' | 'nv' | 'nd' | 'ne' | 'ng' | 'nb' | 'nn' | 'no' | 'ii' | 'nr'
                     | 'oc' | 'oj' | 'cu' | 'om' | 'or' | 'os' | 'pa' | 'pi' | 'fa' | 'pl' | 'ps' | 'pt' | 'qu'
                     | 'rm' | 'rn' | 'ro' | 'ru' | 'sa' | 'sc' | 'sd' | 'se' | 'sm' | 'sg' | 'sr' | 'gd' | 'sn'
                     | 'si' | 'sk' | 'sl' | 'st' | 'es' | 'su' | 'sw' | 'ss' | 'sv' | 'ta' | 'tg' | 'th' | 'ti'
                     | 'bo' | 'tk' | 'tl' | 'tn' | 'to' | 'tr' | 'ts' | 'tt' | 'tw' | 'ty' | 'ug' | 'uk' | 'ur'
                     | 'uz' | 've' | 'vi' | 'vo' | 'wa' | 'cy' | 'wo' | 'fy' | 'xh' | 'yi' | 'yo' | 'za' | 'zu';

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
    'si', 'sk', 'sl', 'st', 'es', 'su', 'sw', 'ss', 'sv', 'ta', 'tg', 'th', 'ti',
    'bo', 'tk', 'tl', 'tn', 'to', 'tr', 'ts', 'tt', 'tw', 'ty', 'ug', 'uk', 'ur',
    'uz', 've', 'vi', 'vo', 'wa', 'cy', 'wo', 'fy', 'xh', 'yi', 'yo', 'za', 'zu' ];

export type UILanguage = 'fi' | 'en';

export const availableUILanguages: UILanguage[] = ['fi', 'en'];

export interface Localizer {
  language: Language;
  context: LanguageContext;
  translate(localizable: Localizable): string;
  getStringWithModelLanguageOrDefault(key: string|undefined|null, defaultLanguage: UILanguage): string;
  allUILocalizationsForKey(localizationKey: string): string[];
}

function localize(localizable: Localizable, lang: Language, showLang: boolean): string {

  let localization = localizable ? localizable[lang] : '';

  if (Array.isArray(localization)) {
    localization = localization.join(' ');
  }

  if (!localization) {
    return '';
  } else {
    return localization + (showLang ? ` (${lang})` : '');
  }
}

export function translateAny(localizable: Localizable, showLanguage: boolean = false) {
  if (!hasLocalization(localizable)) {
    return '';
  } else {
    return localize(localizable, <Language> Object.keys(localizable)[0], showLanguage);
  }
}

export function createConstantLocalizable(str: string, supportedLanguages?: Language[]) {
  const result: Localizable = {};

  for (const language of supportedLanguages || availableLanguages) {
    result[language] = str;
  }

  return result;
}

export function translate(data: Localizable, language: Language, supportedLanguages?: Language[]): string {

  if (!hasLocalization(data)) {
    return '';
  }

  const localizationForActiveLanguage = localize(data, language, false);

  if (localizationForActiveLanguage) {
    return localizationForActiveLanguage;
  } else if (supportedLanguages) {

    for (const supportedLanguage of supportedLanguages) {

      const localization = localize(data, supportedLanguage, true);

      if (localization) {
        return localization;
      }
    }
  }

  return translateAny(data, true);
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

export function localizableContains(localizable: Localizable, searchString: string) {
  return anyLocalization(localized => localized.toLowerCase().includes(searchString.toLowerCase()), localizable);
}

export function hasLocalization(localizable: Localizable) {
  return !!localizable && hasValue(localizable);
}

