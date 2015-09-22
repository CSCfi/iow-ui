module.exports = function propertyView($log) {
  'ngInject';
  return {
    scope: {
      predicate: '=predicate',
      context: '=context'
    },
    template: require('./templates/propertyView.html'),
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
