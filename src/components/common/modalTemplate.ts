import IAttributes = angular.IAttributes;
import IFormController = angular.IFormController;
import IScope = angular.IScope;
import { EditableForm } from '../form/editableEntityController';

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
    require: '^?form',
    link($scope: ModalTemplateScope, element: JQuery, attributes: ModalTemplateAttributes, formController: EditableForm) {
      $scope.defaultButtons = attributes.default;
      if (formController) {
        formController.editing = true;
      }
    }
  };
});

interface ModalTemplateScope extends IScope {
  defaultButtons: boolean;
}
