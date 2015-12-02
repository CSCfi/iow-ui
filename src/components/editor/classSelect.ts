import IAttributes = angular.IAttributes;
import IFormController = angular.IFormController;
import IScope = angular.IScope;
import { SearchClassModal } from './searchClassModal';
import { Model, Uri } from '../../services/entities';

export const mod = angular.module('iow.components.editor');

interface ClassSelectScope extends IScope {
  formController: IFormController;
}

mod.directive('classSelect', () => {
  'ngInject';
  return {
    scope: {
      curie: '=',
      model: '=',
      id: '@'
    },
    restrict: 'E',
    controllerAs: 'ctrl',
    bindToController: true,
    template: require('./classSelect.html'),
    require: '?^form',
    link($scope: ClassSelectScope, element: JQuery, attributes: IAttributes, formController: IFormController) {
      $scope.formController = formController;
    },
    controller: ClassSelectController
  }
});

export class ClassSelectController {

  curie: string;
  name: string;
  model: Model;
  id: Uri;

  constructor(private searchClassModal: SearchClassModal) {
  }

  selectClass() {
    this.searchClassModal.openWithOnlySelection(this.model).then(klass => {
      this.curie = klass.curie;
    });
  }
}
