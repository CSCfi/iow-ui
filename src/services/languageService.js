module.exports = /* @ngInject */ function languageService(gettextCatalog) {
  let language;

  return {
    setLanguage(code) {
      language = code;
      gettextCatalog.setCurrentLanguage(language);
      gettextCatalog.loadRemote(`translations/${language}.json`);
    },
    getLanguage() {
      return language;
    }
  };
};
