module.exports = function classView($log) {
  'ngInject';
  return {
    scope: {
      title: '@',
      content: '='
    },
    restrict: 'E',
    template: require('./templates/formInput.html'),
    controller($scope, $modal, modelLanguage) {
      'ngInject';
      $scope.getLanguage = modelLanguage.getLanguage;
      $scope.hasContentForLanguage = () => $scope.content && $scope.content[modelLanguage.getLanguage()];

      $scope.editing = false;

      $scope.startEdit = () => {
        $scope.editing = true;
      };

      $scope.stopEdit = () => {
        $scope.editing = false;
      };
    }
  };
};
