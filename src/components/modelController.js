module.exports = function modelController($scope, $routeParams, $log, modelService, classService, propertyService) {
  'ngInject';
  modelService.getModelByUrn($routeParams.urn).then(response => {
    $scope.rawModel = response;
    $scope.model = response['@graph'][0];
    $scope.context = response['@context'];

    classService.getClassesForModel($routeParams.urn).then(data => {
      $scope.classes = data['@graph'];
    }, err => {
      $log.error(err);
    });

    propertyService.getPropertiesForModel($routeParams.urn).then(data => {
      $scope.attributes = data.attributes['@graph'];
      $scope.associations = data.associations['@graph'];
    }, err => {
      $log.error(err);
    });

    function clearAll() {
      $scope.attribute = undefined;
      $scope.activeAttribute = undefined;
      $scope.class = undefined;
      $scope.activeClass = undefined;
      $scope.association = undefined;
      $scope.activeAssociation = undefined;
    }

    $scope.activateClass = (klass, index) => {
      clearAll();
      $scope.class = klass;
      $scope.activeClass = index;
    };

    $scope.activateAttribute = (attribute, index) => {
      clearAll();
      $scope.attribute = attribute;
      $scope.activeAttribute = index;
    };

    $scope.activateAssociation = (association, index) => {
      clearAll();
      $scope.association = association;
      $scope.activeAssociation = index;
    };
  });
};
