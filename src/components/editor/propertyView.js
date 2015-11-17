module.exports = function propertyView() {
  'ngInject';
  return {
    scope: {
      property: '='
    },
    restrict: 'E',
    template: require('./propertyView.html'),
    require: '^?classView',
    link($scope, element, attributes, editableController) {
      $scope.editableController = editableController;
    },
    controller($scope, predicateService) {
      'ngInject';

      predicateService.getPredicate($scope.property.predicateId).then(predicate => {
        $scope.predicate = predicate;
      });
    }
  };
};
