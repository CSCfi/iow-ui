const utils = require('../../services/utils');

module.exports = function classForm() {
  'ngInject';
  return {
    scope: {
      class: '=',
      references: '='
    },
    restrict: 'E',
    template: require('./classForm.html')
  };
};
