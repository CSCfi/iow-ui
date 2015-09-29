module.exports = function associationView($log) {
  'ngInject';
  return {
    scope: {
      association: '='
    },
    restrict: 'E',
    template: require('./templates/associationView.html'),
    controller($scope, modelLanguage) {
      'ngInject';
      $scope.translate = modelLanguage.translate;
    }
  };
};
