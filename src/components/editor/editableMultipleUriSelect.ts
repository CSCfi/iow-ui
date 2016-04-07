import IAttributes = angular.IAttributes;
import IFormController = angular.IFormController;
import INgModelController = angular.INgModelController;
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
import { Uri } from '../../services/uri';

import { module as mod }  from './module';

mod.directive('editableMultipleUriSelect', () => {
  return {
    scope: {
      uris: '=',
      type: '@',
      model: '=',
      id: '@',
      title: '@',
      allowInput: '='
    },
    restrict: 'E',
    controllerAs: 'ctrl',
    bindToController: true,
    template: require('./editableMultipleUriSelect.html'),
    require: ['editableMultipleUriSelect', '?^form'],
    link($scope: EditableMultipleUriSelectScope, element: JQuery, attributes: IAttributes, [thisController, formController]: [EditableMultipleUriSelectController, EditableForm]) {
      thisController.isEditing = () => formController.editing;

      const input = element.find('[ng-model]');
      $scope.uriInputController = input.controller('ngModel');
    },
    controller: EditableMultipleUriSelectController
  };
});

interface EditableMultipleUriSelectScope extends IScope {
  uriInputController: INgModelController;
}

interface WithId {
  id: Uri;
}

class EditableMultipleUriSelectController {

  uris: Uri[];
  type: Type;
  model: Model;
  id: string;
  isEditing: () => boolean;
  uriInput: Uri;
  title: string;

  items: DisplayItem[];

  /* @ngInject */
  constructor($scope: IScope,
              displayItemFactory: DisplayItemFactory,
              private searchPredicateModal: SearchPredicateModal,
              private searchClassModal: SearchClassModal) {

    const link = (uri: Uri) => this.model.linkTo({ type: this.type, id: uri });

    $scope.$watchCollection(() => this.uris, uris => {
      this.items = _.map(uris, uri => displayItemFactory.create(() => uri, link, false, () => this.isEditing()));
    });
  }

  addUri() {
    const existsExclusion = createExistsExclusion(collectProperties(this.uris, uri => uri.uri));
    const definedExclusion = createDefinedByExclusion(this.model);
    const classExclusion = combineExclusions<ClassListItem>(existsExclusion, definedExclusion);
    const predicateExclusion = combineExclusions<PredicateListItem>(existsExclusion, definedExclusion);

    const promise: IPromise<WithId> = this.type === 'class'
      ? this.searchClassModal.openWithOnlySelection(this.model, classExclusion)
      : this.searchPredicateModal.openWithOnlySelection(this.model, this.type, predicateExclusion);

    promise.then(withId => {
      this.uris.push(withId.id);
    });
  }

  deleteUri(item: DisplayItem) {
    const value = item.value();
    _.remove(this.uris, uri => uri === value);
  }

  keyPressed(event: JQueryEventObject) {
    const enter = 13;
    if (event.keyCode === enter) {
      event.preventDefault();
      this.addUriFromInput();
    }
  }

  addUriFromInput() {
    if (this.uriInput) {
      this.uris.push(this.uriInput);
      this.uriInput = null;
    }
  }
}
