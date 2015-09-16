module.exports = function classView($log) {
  'ngInject';
  return {
    scope: {
      class: '=activeClass'
    },
    template: require('./templates/classView.html'),
    controller($scope, modelLanguage) {
      'ngInject';
      $scope.getLanguage = modelLanguage.getLanguage;
    }
  };
};
