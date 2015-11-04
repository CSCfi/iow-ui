const _ = require('lodash');

module.exports = function modelLanguage() {
  'ngInject';
  const languages = ['fi', 'en'];
  let language = languages[0];

  return {
    getLanguage() {
      return language;
    },
    getAvailableLanguages() {
      return languages;
    },
    setLanguage(lang) {
      language = lang;
    },
    translate(label) {
      function localized(lang) {
        const localization = label[lang];
        return typeof localization === 'string' ? localization : null;
      }
      if (label) {
        return localized(language) || _.chain(languages).map(localized).find().value() || '';
      } else {
        return '';
      }
    }
  };
};
