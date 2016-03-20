import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import ITimeoutService = angular.ITimeoutService;

import { module as mod }  from './module';

mod.directive('ngHref', ($timeout: ITimeoutService) => {
  return {
    restrict: 'A',
    link($scope: IScope, element: JQuery) {
      $timeout(() => {
        const link = element.attr('href');
        if (link && !link.startsWith('/') && !link.startsWith('#')) {
          element.attr('target', '_blank');
        }
      });
    }
  };
});
