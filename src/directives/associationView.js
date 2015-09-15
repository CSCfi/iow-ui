module.exports = function /* @ngInject */ associationView($log) {
  return {
    scope: {
      association: '='
    },
    template: require('./templates/associationView.html'),
    controller($scope, modelLanguage) {
      $scope.getLanguage = modelLanguage.getLanguage;
    }
  };
};
