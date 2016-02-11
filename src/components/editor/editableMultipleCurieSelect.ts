import IAttributes = angular.IAttributes;
import IFormController = angular.IFormController;
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import * as _ from 'lodash';
import { SearchPredicateModal } from './searchPredicateModal';
import { EditableForm } from '../form/editableEntityController';
import { Model, Type, ClassListItem, PredicateListItem } from '../../services/entities';
import { SearchClassModal } from './searchClassModal';
import { DisplayItemFactory, DisplayItem } from '../form/displayItemFactory';
import {
  createExistsExclusion,
  collectProperties,
  combineExclusions,
  createDefinedByExclusion
} from '../../services/utils';
import create = require("core-js/fn/object/create");

export const mod = angular.module('iow.components.editor');

mod.directive('editableMultipleCurieSelect', () => {
  'ngInject';
  return {
    scope: {
      curies: '=',
      type: '@',
      model: '=',
      id: '@',
      title: '@',
      allowInput: '='
    },
    restrict: 'E',
    controllerAs: 'ctrl',
    bindToController: true,
    template: require('./editableMultipleCurieSelect.html'),
    require: ['editableMultipleCurieSelect', '?^form'],
    link($scope: IScope, element: JQuery, attributes: IAttributes, controllers: [EditableMultipleCurieSelectController, EditableForm]) {
      controllers[0].isEditing = () => controllers[1].editing;
    },
    controller: EditableMultipleCurieSelectController
  };
});

interface WithCurie {
  curie: string;
}

class EditableMultipleCurieSelectController {

  curies: string[];
  type: Type;
  model: Model;
  id: string;
  isEditing: () => boolean;
  curieInput: string;
  title: string;

  items: DisplayItem[];

  /* @ngInject */
  constructor($scope: IScope,
              displayItemFactory: DisplayItemFactory,
              private searchPredicateModal: SearchPredicateModal,
              private searchClassModal: SearchClassModal) {

    const link = (curie: string) => this.model.linkTo(this.type, curie);

    $scope.$watchCollection(() => this.curies, curies => {
      this.items =_.map(curies, curie => displayItemFactory.create(() => curie, link, false, () => this.isEditing()));
    });
  }

  addCurie() {
    const existsExclusion = createExistsExclusion(collectProperties(this.curies, curie => this.model.expandCurie(curie).uri));
    const definedExclusion = createDefinedByExclusion(this.model);
    const classExclusion = combineExclusions<ClassListItem>(existsExclusion, definedExclusion);
    const predicateExclusion = combineExclusions<PredicateListItem>(existsExclusion, definedExclusion);

    const promise: IPromise<WithCurie> = this.type === 'class'
      ? this.searchClassModal.openWithOnlySelection(this.model, classExclusion)
      : this.searchPredicateModal.openWithOnlySelection(this.model, this.type, predicateExclusion);

    promise.then(withCurie => {
      this.curies.push(withCurie.curie);
    });
  }

  deleteCurie(item: DisplayItem) {
    const value = item.value();
    _.remove(this.curies, curie => curie === value);
  }

  keyPressed(event: JQueryEventObject) {
    const enter = 13;
    if (event.keyCode === enter) {
      event.preventDefault();
      this.addCurieFromInput();
    }
  }

  addCurieFromInput() {
    if (this.curieInput) {
      this.curies.push(this.curieInput);
      this.curieInput = '';
    }
  }
}
