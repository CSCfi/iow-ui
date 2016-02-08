import IAttributes = angular.IAttributes;
import IFormController = angular.IFormController;
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import * as _ from 'lodash';
import { SearchPredicateModal } from './searchPredicateModal';
import { EditableForm } from '../form/editableEntityController';
import { Model, Type, Uri } from '../../services/entities';
import { SearchClassModal, SearchClassType } from './searchClassModal';
import { DisplayItemFactory, DisplayItem } from '../form/displayItemFactory';

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

    const link = (curie: string) => this.model.linkTo(this.type, curie, this.model);

    $scope.$watchCollection(() => this.curies, curies => {
      this.items =_.map(curies, curie => displayItemFactory.create(() => curie, link, false, () => this.isEditing()));
    });
  }

  addCurie() {
    const excluded = new Map<Uri, string>();

    for(const curie of this.curies) {
      excluded.set(this.model.expandCurie(curie).uri, 'Already added');
    }

    const promise: IPromise<WithCurie> = this.type === 'class'
      ? this.searchClassModal.openWithOnlySelection(this.model, SearchClassType.All, excluded)
      : this.searchPredicateModal.openWithOnlySelection(this.model, this.type, excluded);

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
