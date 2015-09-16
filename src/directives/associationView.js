module.exports = function associationView($log) {
  'ngInject';
  return {
    scope: {
      association: '='
    },
    template: require('./templates/associationView.html'),
    controller($scope, modelLanguage) {
      'ngInject';
      $scope.getLanguage = modelLanguage.getLanguage;
    }
  };
};
