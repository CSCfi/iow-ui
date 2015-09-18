module.exports = function modelLanguage() {
  'ngInject';
  const languages = ['fi'];
  let language = 'fi';

  return {
    getLanguage() {
      return language;
    },
    getAvailableLanguages() {
      return languages;
    },
    setLanguage(lang) {
      language = lang;
    }
  };
};
