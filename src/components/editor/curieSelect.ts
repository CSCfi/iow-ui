import IAttributes = angular.IAttributes;
import ICompiledExpression = angular.ICompiledExpression;
import IFormController = angular.IFormController;
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import { SearchPredicateModal } from './searchPredicateModal';
import { SearchClassModal } from './searchClassModal';
import { EditableForm } from '../form/editableEntityController';
import { Model, Type, Uri } from '../../services/entities';
import { createDefinedByExclusion } from '../../services/utils';

export const mod = angular.module('iow.components.editor');

// TODO rename
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

interface WithId {
  id: Uri;
}

class CurieSelectController {

  curie: Uri;
  type: Type;
  model: Model;
  id: string;
  afterSelected: ICompiledExpression;
  mandatory: boolean;

  constructor(private searchPredicateModal: SearchPredicateModal, private searchClassModal: SearchClassModal) {
  }

  selectCurie() {
    const promise: IPromise<WithId> = this.type === 'class'
      ? this.searchClassModal.openWithOnlySelection(this.model, createDefinedByExclusion(this.model))
      : this.searchPredicateModal.openWithOnlySelection(this.model, this.type, createDefinedByExclusion(this.model));

    promise.then(withId => {
      this.curie = withId.id;
      this.afterSelected({id: withId.id});
    });
  }
}
