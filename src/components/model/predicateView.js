module.exports = function predicateView() {
  'ngInject';
  return {
    scope: {
      predicate: '=',
      model: '='
    },
    restrict: 'E',
    template: require('./predicateView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    require: ['predicateView', '^ngController'],
    link($scope, element, attributes, controllers) {
      $scope.modelController = controllers[1];
      $scope.modelController.registerView(controllers[0]);
    },
    controller($scope, predicateService, editableController) {
      'ngInject';

      editableController.mixin($scope, this, 'predicate', predicateService.createPredicate, predicateService.updatePredicate, predicateService.deletePredicate);
    }
  };
};
