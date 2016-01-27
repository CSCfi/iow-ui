import IAttributes = angular.IAttributes;
import ICompiledExpression = angular.ICompiledExpression;
import IFormController = angular.IFormController;
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import { SearchPredicateModal } from './searchPredicateModal';
import { SearchClassModal, SearchClassType } from './searchClassModal';
import { EditableForm } from '../form/editableEntityController';
import { Model, Type } from '../../services/entities';

export const mod = angular.module('iow.components.editor');

mod.directive('curieSelect', () => {
  'ngInject';
  return {
    scope: {
      curie: '=',
      type: '@',
      model: '=',
      id: '@',
      afterSelected: '&',
      mandatory: '='
    },
    restrict: 'E',
    controllerAs: 'ctrl',
    bindToController: true,
    template: require('./curieSelect.html'),
    require: '?^form',
    link($scope: EditableScope, element: JQuery, attributes: IAttributes, formController: EditableForm) {
      $scope.formController = formController;
    },
    controller: CurieSelectController
  };
});

interface EditableScope extends IScope {
  formController: EditableForm;
}

interface WithCurie {
  curie: string;
}

class CurieSelectController {

  curie: string;
  type: Type;
  model: Model;
  id: string;
  afterSelected: ICompiledExpression;
  mandatory: boolean;

  constructor(private searchPredicateModal: SearchPredicateModal, private searchClassModal: SearchClassModal) {
  }

  selectCurie() {
    const promise: IPromise<WithCurie> = this.type === 'class'
      ? this.searchClassModal.openWithOnlySelection(this.model, SearchClassType.Both)
      : this.searchPredicateModal.openWithOnlySelection(this.model, this.type);

    promise.then(withCurie => {
      this.curie = withCurie.curie;
      this.afterSelected({id: this.model.expandCurie(withCurie.curie).uri});
    });
  }
}
