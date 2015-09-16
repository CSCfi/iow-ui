module.exports = function modelLanguage() {
  'ngInject';
  let language = 'fi';

  return {
    getLanguage() {
      return language;
    },
    setLanguage(lang) {
      language = lang;
    }
  };
};
