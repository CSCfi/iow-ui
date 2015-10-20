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
    translate(label, languagesLeft = defaultLanguages) {
      if (label && languagesLeft.length > 0) {
        return label[language] || label[_.first(languagesLeft)] || this.translate(label, _.rest(languagesLeft));
      }
    }
  };
};
