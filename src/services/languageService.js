const _ = require('lodash');

module.exports = function languageService(gettextCatalog) {
  'ngInject';

  const languages = ['fi', 'en'];
  const defaultLanguage = 'fi';

  let modelLanguage = defaultLanguage;

  setGettextLanguage(defaultLanguage);

  function setGettextLanguage(language) {
    gettextCatalog.setCurrentLanguage(language);
    gettextCatalog.loadRemote(`translations/${language}.json`);
  }

  return {
    getUiLanguage() {
      return gettextCatalog.getCurrentLanguage();
    },
    setUiLanguage(language) {
      setGettextLanguage(language);
    },
    setModelLanguage(language) {
      modelLanguage = language;
    },
    getModelLanguage() {
      return modelLanguage;
    },
    getAvailableLanguages() {
      return languages;
    },
    translate(data) {
      function localized(lang) {
        const localization = data[lang];
        return typeof localization === 'string' ? localization : null;
      }

      if (!data) {
        return '';
      }

      return localized(modelLanguage) || _.chain(languages).map(localized).find().value() || '';
    }
  };
};
