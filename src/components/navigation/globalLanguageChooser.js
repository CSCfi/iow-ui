module.exports = function globalLanguageChooser() {
  'ngInject';
  return {
    scope: {
    },
    restrict: 'E',
    template: require('./globalLanguageChooser.html'),
    controller($scope, languageService) {
      'ngInject';
      $scope.currentLanguage = languageService.getUiLanguage;
      $scope.setLanguage = language => {
        languageService.setUiLanguage(language);
        languageService.setModelLanguage(language);
      };
      $scope.languages = languageService.getAvailableLanguages();
    }
  };
};
