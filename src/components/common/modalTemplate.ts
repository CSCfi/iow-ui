import IAttributes = angular.IAttributes;
import IScope = angular.IScope;

export const mod = angular.module('iow.components.common');

interface ModalTemplateAttributes extends IAttributes {
  'default': boolean;
}

mod.directive('modalTemplate', () => {
  return {
    restrict: 'E',
    transclude: {
      modalTitle: 'title',
      modalBody: 'body',
      modalButtons: '?buttons'
    },
    template: require('./modalTemplate.html'),
    link($scope: ModalTemplateScope, element: JQuery, attributes: ModalTemplateAttributes) {
      $scope.defaultButtons = attributes.default;
    }
  };
});

interface ModalTemplateScope extends IScope {
  defaultButtons: boolean;
}
