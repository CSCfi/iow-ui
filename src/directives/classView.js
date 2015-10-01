module.exports = function classView($log) {
  'ngInject';
  return {
    scope: {
      id: '=classId',
    },
    restrict: 'E',
    template: require('./templates/classView.html'),
    controller($scope, $modal, classService, modelLanguage) {
      'ngInject';
      classService.getClass($scope.id).then(data => {
        $scope.class = data['@graph'][0];
        $scope.context = data['@context'];
      }, err => {
        $log.error(err);
      });

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
