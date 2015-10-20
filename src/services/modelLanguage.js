const _ = require('lodash');

module.exports = function modelLanguage() {
  'ngInject';
  const languages = ['fi', 'en'];
  const defaultLanguages = ['fi', 'en'];
  let language = defaultLanguages[0];

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
      function innerTranslate(label, currentLanguage, languagesLeft) {
        if (label && currentLanguage) {
          return label[currentLanguage] || innerTranslate(label, _.first(languagesLeft), _.rest(languagesLeft));
        }
      }

      return innerTranslate(label, language, defaultLanguages);
    }
  };
};
