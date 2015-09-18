module.exports = function modelLanguage() {
  'ngInject';
  const languages = ['fi', 'en'];
  const defaultLanguage = 'fi';
  let language = defaultLanguage;

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
        return label[language] || label[defaultLanguage];
      }
    }
  };
};
