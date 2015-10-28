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
      if (label) {
        return label[language] || _.chain(languages).map(lang => label[lang]).find().value() || label;
      }
    }
  };
};
