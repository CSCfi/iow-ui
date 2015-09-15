module.exports = /* @ngInject */ function modelLanguage() {
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
