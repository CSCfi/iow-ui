import { dataTypes } from '../common/dataTypes';

export const mod = angular.module('iow.components.editor');

mod.directive('rangeSelect', () => {
  return {
    scope: {
      range: '=',
      id: '@'
    },
    restrict: 'E',
    template: '<localized-select id="{{ctrl.id}}" values="ctrl.ranges" value="ctrl.range"></localized-select>',
    controllerAs: 'ctrl',
    bindToController: true,
    controller() {
      this.ranges = dataTypes;
    }
  };
});
