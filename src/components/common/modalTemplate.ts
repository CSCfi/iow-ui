import { IAttributes, IScope } from 'angular';
import { EditableForm } from '../form/editableEntityController';
import { module as mod }  from './module';
import { isDefined } from '../../utils/object';

interface ModalTemplateAttributes extends IAttributes {
  'default': string;
  'editing': string;
  'purpose': string;
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
      $scope.headerClass = 'modal-header-' + (isDefined(attributes.purpose) ? attributes.purpose : 'normal');
      const editing = 'editing' in attributes.$attr ? attributes.editing === 'true' : true;
      if (formController && editing) {
        formController.editing = true;
      }
    }
  };
});

interface ModalTemplateScope extends IScope {
  defaultButtons: boolean;
  headerClass: string;
}
