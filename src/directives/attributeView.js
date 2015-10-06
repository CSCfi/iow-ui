module.exports = function classView($log) {
  'ngInject';
  return {
    scope: {
      attributeParam: '=attribute'
    },
    restrict: 'E',
    template: require('./templates/attributeView.html'),
    controller($scope, propertyService, modelLanguage) {
      'ngInject';
      $scope.translate = modelLanguage.translate;

      $scope.$watch("attributeParam['@id']", id => {
        propertyService.getPropertyById(id).then(data => {
          $scope.attribute = data['@graph'][0];
        });
      });
    }
  };
};
