module.exports = function classView($log) {
  'ngInject';
  return {
    scope: {
      attribute: '='
    },
    template: require('./templates/attributeView.html'),
    controller($scope, modelLanguage) {
      'ngInject';
      $scope.getLanguage = modelLanguage.getLanguage;
    }
  };
};
