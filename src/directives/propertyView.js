const jsonld = require('jsonld');

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
          $scope.property = property;
        });
      });
      $scope.translate = modelLanguage.translate;
    }
  };
};
