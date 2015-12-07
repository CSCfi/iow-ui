import IAttributes = angular.IAttributes;
import IRepeatScope = angular.IRepeatScope;
import IScope = angular.IScope;
import ITimeoutService = angular.ITimeoutService;

export const mod = angular.module('iow.components.common');

const selectionClass = 'selection';

mod.directive('keyControlSelection', ($timeout: ITimeoutService) => {
  return {
    restrict: 'A',
    link($scope: IRepeatScope, element: JQuery) {
      const itemContainer = element.parent();

      function update(selectionIndex: number) {
        if ($scope.$index === selectionIndex) {
          element.addClass(selectionClass);

          const itemsHeight = itemContainer.height();
          const itemsTop = itemContainer.scrollTop();
          const itemsBottom = itemsHeight + itemsTop;
          const selectionOffsetTop = element.offset().top - itemContainer.offset().top + itemsTop;
          const selectionOffsetBottom = selectionOffsetTop +  element.outerHeight();

          if (selectionOffsetBottom > itemsBottom) {
            itemContainer.animate({ scrollTop: Math.ceil(selectionOffsetBottom - itemsHeight) }, 0);
          } else if (selectionOffsetTop < itemsTop) {
            itemContainer.animate({ scrollTop: Math.floor(selectionOffsetTop) }, 0);
          }
        } else {
          element.removeClass(selectionClass);
        }
      }

      $scope.$on('selectionMoved', (event, selectionIndex) => update(selectionIndex));
      $scope.$on('selectionSelected', (event, selectionIndex) => {
        if (selectionIndex === $scope.$index) {
          // do outside of digest cycle
          $timeout(() => element.click());
        }
      })
    }
  };
});
