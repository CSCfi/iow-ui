export const mod = angular.module('iow.components.form');

const states = ['Unstable', 'Draft', 'Recommendation', 'Deprecated'];

mod.directive('stateSelect', () => {
  'ngInject';
  return {
    scope: {
      state: '='
    },
    restrict: 'E',
    template: '<value-select name="State" values="ctrl.states" value="ctrl.state"></value-select>',
    controllerAs: 'ctrl',
    bindToController: true,
    controller() {
      this.states = states;
    }
  };
});
