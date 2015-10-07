module.exports = function modelLanguageChooser($log) {
  'ngInject';
  return {
    scope: {
    },
    restrict: 'E',
    template: require('./templates/modelLanguageChooser.html'),
    controller($scope, modelLanguage) {
      'ngInject';
      $scope.currentLanguage = modelLanguage.getLanguage;
      $scope.setLanguage = modelLanguage.setLanguage;
      $scope.languages = modelLanguage.getAvailableLanguages();
    }
  };
};
