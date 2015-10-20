const _ = require('lodash');
const jsonld = require('jsonld');

module.exports = function classView($log) {
  'ngInject';

  return {
    scope: {
      model: '='
    },
    restrict: 'E',
    template: require('./templates/modelView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    controller(modelService) {
      'ngInject';
    }
  };
};
