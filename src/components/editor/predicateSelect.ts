import IAttributes = angular.IAttributes;
import IFormController = angular.IFormController;
import IScope = angular.IScope;
import { SearchPredicateModal } from './searchPredicateModal';
import { EditableForm } from '../form/editableEntityController';
import { Model, Type } from '../../services/entities';

export const mod = angular.module('iow.components.editor');

mod.directive('predicateSelect', () => {
  'ngInject';
  return {
    scope: {
      curie: '=',
      type: '=',
      model: '='
    },
    restrict: 'E',
    controllerAs: 'ctrl',
    bindToController: true,
    template: require('./predicateSelect.html'),
    require: '?^form',
    link($scope: EditableScope, element: JQuery, attributes: IAttributes, formController: EditableForm) {
      $scope.formController = formController;
    },
    controller: PredicateSelectController
  };
});

interface EditableScope extends IScope {
  formController: EditableForm;
}

class PredicateSelectController {

  curie: string;
  type: Type;
  model: Model;

  /* @ngInject */
  constructor(private searchPredicateModal: SearchPredicateModal) {
  }

  selectPredicate() {
    this.searchPredicateModal.openWithOnlySelection(this.model, this.type).then(predicate => {
      this.curie = predicate.curie;
    });
  };
}
