import IAttributes = angular.IAttributes;
import IFormController = angular.IFormController;
import IScope = angular.IScope;
import { SearchPredicateModal } from './searchPredicateModal';
import { EditableForm } from '../form/editableEntityController';
import { Model, Type } from '../../services/entities';
import IPromise = angular.IPromise;
import {SearchClassModal} from "./searchClassModal";

export const mod = angular.module('iow.components.editor');

mod.directive('curieSelect', () => {
  'ngInject';
  return {
    scope: {
      curie: '=',
      type: '@',
      model: '=',
      id: '@'
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

  constructor(private searchPredicateModal: SearchPredicateModal, private searchClassModal: SearchClassModal) {
  }

  selectCurie() {
    const promise: IPromise<WithCurie> = this.type ==='class'
      ? this.searchClassModal.openWithOnlySelection(this.model)
      : this.searchPredicateModal.openWithOnlySelection(this.model, this.type);

    promise.then(withCurie => this.curie = withCurie.curie);
  }
}
