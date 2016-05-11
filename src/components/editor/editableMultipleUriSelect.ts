import IAttributes = angular.IAttributes;
import IFormController = angular.IFormController;
import INgModelController = angular.INgModelController;
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import { SearchPredicateModal } from './searchPredicateModal';
import { Model, Type, ClassListItem, PredicateListItem } from '../../services/entities';
import { SearchClassModal } from './searchClassModal';
import {
  createExistsExclusion,
  collectProperties,
  combineExclusions,
  createDefinedByExclusion
} from '../../services/utils';
import { Uri } from '../../services/uri';
import { module as mod }  from './module';
import gettextCatalog = angular.gettext.gettextCatalog;
import { EditableForm } from '../form/editableEntityController';

mod.directive('editableMultipleUriSelect', () => {
  return {
    scope: {
      ngModel: '=',
      type: '@',
      model: '=',
      id: '@',
      title: '@'
    },
    restrict: 'E',
    controllerAs: 'ctrl',
    bindToController: true,
    template: `
      <editable-multiple id="{{ctrl.id}}" data-title="{{ctrl.title}}" ng-model="ctrl.ngModel" link="ctrl.link" input="ctrl.input">

        <input-container>
          <input id="{{ctrl.id}}"
                 type="text"
                 restrict-duplicates="ctrl.ngModel"
                 uri-input
                 model="ctrl.model"
                 ng-model="ctrl.input" />
         </input-container>

        <button-container>
          <button ng-if="ctrl.isEditing()" type="button" class="btn btn-default btn-sm" style="display: block" ng-click="ctrl.selectUri()">{{('Choose ' + ctrl.type) | translate}}</button>
        </button-container>

      </editable-multiple>
    `,
    require: ['editableMultipleUriSelect', '?^form'],
    link($scope: IScope, element: JQuery, attributes: IAttributes, [thisController, formController]: [EditableMultipleUriSelectController, EditableForm]) {
      thisController.isEditing = () => formController.editing;
    },
    controller: EditableMultipleUriSelectController
  };
});

interface WithId {
  id: Uri;
}

class EditableMultipleUriSelectController {

  ngModel: Uri[];
  input: Uri;
  type: Type;
  model: Model;
  id: string;
  title: string;
  link = (uri: Uri) => this.model.linkTo({ type: this.type, id: uri }, true);

  isEditing: () => boolean;
  addUri: (uri: Uri) => void;

  /* @ngInject */
  constructor(private searchPredicateModal: SearchPredicateModal, private searchClassModal: SearchClassModal) {
  }

  selectUri() {
    const existsExclusion = createExistsExclusion(collectProperties(this.ngModel, uri => uri.uri));
    const definedExclusion = createDefinedByExclusion(this.model);
    const classExclusion = combineExclusions<ClassListItem>(existsExclusion, definedExclusion);
    const predicateExclusion = combineExclusions<PredicateListItem>(existsExclusion, definedExclusion);

    const promise: IPromise<WithId> = this.type === 'class'
      ? this.searchClassModal.openWithOnlySelection(this.model, classExclusion)
      : this.searchPredicateModal.openWithOnlySelection(this.model, this.type, predicateExclusion);

    promise.then(withId => {
      this.ngModel.push(withId.id);
    });
  }
}
