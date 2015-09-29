module.exports = function predicateView($log) {
  'ngInject';
  return {
    scope: {
      predicate: '=predicate',
      context: '=context'
    },
    template: require('./templates/predicateView.html'),
    controller($scope, $http, propertyService, modelLanguage) {
      'ngInject';

      propertyService.getProperty($scope.predicate, $scope.context).then(property => {
        $scope.$apply(() => {
          $scope.property = property['@graph'][0];
        });
      });
      $scope.translate = modelLanguage.translate;
    }
  };
};
