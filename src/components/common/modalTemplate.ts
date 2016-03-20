import IAttributes = angular.IAttributes;
import IFormController = angular.IFormController;
import IScope = angular.IScope;
import { EditableForm } from '../form/editableEntityController';
import { module as mod }  from './module';

interface ModalTemplateAttributes extends IAttributes {
  'default': string;
  'editing': string;
}

mod.directive('modalTemplate', () => {
  return {
    restrict: 'E',
    transclude: {
      title: 'modalTitle',
      body: 'modalBody',
      buttons: '?modalButtons'
    },
    template: require('./modalTemplate.html'),
    require: '^?form',
    link($scope: ModalTemplateScope, element: JQuery, attributes: ModalTemplateAttributes, formController: EditableForm) {
      $scope.defaultButtons = attributes.default === 'true';
      const editing = 'editing' in attributes.$attr ? attributes.editing === 'true' : true;
      if (formController && editing) {
        formController.editing = true;
      }
    }
  };
});

interface ModalTemplateScope extends IScope {
  defaultButtons: boolean;
}
