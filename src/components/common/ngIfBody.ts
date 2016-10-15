import { module as mod } from './module';
import { IScope, IAttributes, ITranscludeFunction, IDocumentService } from 'angular';

interface NgIfBodyAttributes extends IAttributes {
  ngIfBody: string;
}

mod.directive('ngIfBody', /* @ngInject */ ($document: IDocumentService) => {
  return {
    transclude: 'element',
    priority: 600,
    terminal: true,
    restrict: 'A',
    link($scope: IScope, _element: JQuery, attributes: NgIfBodyAttributes, _ctrls: any, $transclude: ITranscludeFunction) {

      let childScope: IScope | undefined | null;
      let previousElement: JQuery | undefined | null;

      const body = angular.element($document.find('body'));

      $scope.$watch(attributes.ngIfBody, (value) => {
        if (value) {
          if (!childScope) {
            // append to body
            $transclude((clone, newScope) => {
              body.append(clone!);
              previousElement = clone;
              childScope = newScope;
            });
          }
        } else {
          // clean from body
          if (previousElement) {
            previousElement.remove();
            previousElement = null;
          }

          if (childScope) {
            childScope.$destroy();
            childScope = null;
          }
        }
      });
    }
  };
});
