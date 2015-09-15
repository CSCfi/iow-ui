module.exports = function /* @ngInject */ classView($log) {
  return {
    scope: {
      class: '=activeClass'
    },
    template: require('./templates/classView.html'),
    controller($scope, modelLanguage) {
      $scope.getLanguage = modelLanguage.getLanguage;
    }
  };
};
