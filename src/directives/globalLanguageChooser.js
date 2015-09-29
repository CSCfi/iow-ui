module.exports = function globalLanguageChooser($log) {
  'ngInject';
  return {
    scope: {
    },
    restrict: 'E',
    template: require('./templates/globalLanguageChooser.html'),
    controller($scope, languageService) {
      'ngInject';
      $scope.currentLanguage = languageService.getLanguage;
      $scope.setLanguage = languageService.setLanguage;
      $scope.languages = ['fi', 'en'];
    }
  };
};
