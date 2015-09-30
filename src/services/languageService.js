module.exports = function languageService(gettextCatalog, modelLanguage) {
  'ngInject';
  let language;

  return {
    setLanguage(code) {
      language = code;
      gettextCatalog.setCurrentLanguage(language);
      gettextCatalog.loadRemote(`translations/${language}.json`);
      modelLanguage.setLanguage(language);
    },
    getLanguage() {
      return language;
    }
  };
};
