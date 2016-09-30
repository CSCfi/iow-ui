import { IScope, ITimeoutService } from 'angular';
import { module as mod }  from './module';

mod.directive('ngHref', ($timeout: ITimeoutService) => {
  return {
    restrict: 'A',
    link(_$scope: IScope, element: JQuery) {
      $timeout(() => {
        const link = element.attr('href');
        if (link && !link.startsWith('/') && !link.startsWith('#')) {
          element.attr('target', '_blank');
        }
      });
    }
  };
});
