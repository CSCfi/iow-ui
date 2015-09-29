module.exports = function classView($log) {
  'ngInject';
  return {
    scope: {
      class: '=activeClass',
      context: '=context'
    },
    restrict: 'E',
    template: require('./templates/classView.html'),
    controller($scope, $modal, modelLanguage) {
      'ngInject';
      $scope.translate = modelLanguage.translate;
      $scope.getLanguage = modelLanguage.getLanguage;

      $scope.addProperty = () => {
        const modal = $modal.open({
          template: require('./templates/addProperty.html')
        });
      };
    }
  };
};
