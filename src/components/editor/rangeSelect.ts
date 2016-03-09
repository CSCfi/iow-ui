import { dataTypes } from '../common/dataTypes';

export const mod = angular.module('iow.components.editor');

mod.directive('rangeSelect', () => {
  'ngInject';
  return {
    scope: {
      range: '=',
      id: '@'
    },
    restrict: 'E',
    template: '<value-select id="{{ctrl.id}}" values="ctrl.ranges" value="ctrl.range"></value-select>',
    controllerAs: 'ctrl',
    bindToController: true,
    controller() {
      this.ranges = dataTypes;
    }
  };
});
