const jsonld = require('jsonld');

module.exports = function propertyView($log) {
  'ngInject';
  return {
    scope: {
      predicate: '=predicate',
      context: '=context'
    },
    template: require('./templates/propertyView.html'),
    controller($scope, $http, modelLanguage) {
      'ngInject';
      const data = {
        predicate: $scope.predicate,
        '@context': $scope.context
      };
      jsonld.promises.expand(data).then(expanded => {
        const id = expanded[0]['http://www.w3.org/ns/shacl#predicate'][0]['@id'];
        return $http.get('/api/rest/property', {params: {id}});
      }).then(property => {
        $scope.$apply(() => {
          $scope.property = property;
        });
      });

      $scope.translate = modelLanguage.translate;
    }
  };
};
