const utils = require('../../services/utils');

module.exports = function classForm() {
  'ngInject';
  return {
    scope: {
      class: '=',
      context: '='
    },
    restrict: 'E',
    template: require('./classForm.html'),
    controller($scope) {
      'ngInject';
      $scope.resolvePropertyIconClass = (property) => {
        return utils.glyphIconClassForType(property.datatype ? 'attribute' : property.valueClass ? 'association' : null);
      };
    }
  };
};
