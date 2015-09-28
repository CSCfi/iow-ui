module.exports = function classView($log) {
  'ngInject';
  return {
    scope: {
      title: '@',
      content: '=content'
    },
    template: require('./templates/formInput.html'),
    controller($scope, $modal, modelLanguage) {
      'ngInject';
      $scope.translate = modelLanguage.translate;
      $scope.getLanguage = modelLanguage.getLanguage;
    }
  };
};
