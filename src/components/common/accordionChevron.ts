import { module as mod }  from './module';

mod.directive('accordionChevron', () => {
  return {
    restrict: 'EA',
    scope: {
      isOpen: '=',
      noPull: '=?'
    },
    transclude: true,
    template: `<ng-transclude></ng-transclude><span ng-class="['fa', {'pull-right': !noPull,'fa-angle-down': isOpen, 'fa-angle-right': !isOpen}]"></span>`,
    require: '^uibAccordionGroup'
  };
});
