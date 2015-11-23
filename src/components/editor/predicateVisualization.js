const jointjs = require('jointjs');

module.exports = function visualizationDirective() {
  return {
    restrict: 'E',
    scope: {
      data: '='
    },
    template: '<div></div>'
  }
};
