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
import { createValidators, createParser, createFormatter, placeholderText } from '../form/uriInput';
import gettextCatalog = angular.gettext.gettextCatalog;
import { EditableForm } from '../form/editableEntityController';

mod.directive('editableMultipleUriSelect', () => {
  return {
    scope: {
      ngModel: '=',
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
  type: Type;
  model: Model;
  id: string;
  title: string;
  allowInput: boolean;
  validators = createValidators(null, () => this.model);
  parser = createParser(() => this.model);
  formatter = createFormatter();
  placeholder = placeholderText(this.gettextCatalog);
  link = (uri: Uri) => this.model.linkTo({ type: this.type, id: uri });

  isEditing: () => boolean;
  addUri: (uri: Uri) => void;

  /* @ngInject */
  constructor(private gettextCatalog: gettextCatalog,
              private searchPredicateModal: SearchPredicateModal,
              private searchClassModal: SearchClassModal) {
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
