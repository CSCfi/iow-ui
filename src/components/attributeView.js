module.exports = function classView($log) {
  'ngInject';
  return {
    scope: {
      attributeParam: '=attribute'
    },
    restrict: 'E',
    template: require('./templates/attributeView.html'),
    controller($scope, propertyService) {
      'ngInject';

      $scope.$watch("attributeParam['@id']", id => {
        propertyService.getPropertyById(id).then(data => {
          $scope.attribute = data['@graph'][0];
        });
      });
    }
  };
};
