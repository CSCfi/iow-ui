export const mod = angular.module('iow.components.common');

mod.directive('accordionChevron', () => {
  return {
    restrict: 'EA',
    scope: {
      isOpen: '=',
      noPull: '=?'
    },
    transclude: true,
    template: `<ng-transclude></ng-transclude><span ng-class="['glyphicon', {'pull-right': !noPull,'glyphicon-chevron-down': isOpen, 'glyphicon-chevron-right': !isOpen}]"></span>`,
    require: '^uibAccordionGroup'
  };
});
