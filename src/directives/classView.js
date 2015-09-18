module.exports = function classView($log) {
  'ngInject';
  return {
    scope: {
      class: '=activeClass',
      context: '=context'
    },
    template: require('./templates/classView.html'),
    controller($scope, modelLanguage) {
      'ngInject';
      $scope.translate = modelLanguage.translate;
    }
  };
};
