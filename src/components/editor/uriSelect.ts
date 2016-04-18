import IAttributes = angular.IAttributes;
import ICompiledExpression = angular.ICompiledExpression;
import IFormController = angular.IFormController;
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import { SearchPredicateModal } from './searchPredicateModal';
import { SearchClassModal } from './searchClassModal';
import { EditableForm } from '../form/editableEntityController';
import { Model, Type } from '../../services/entities';
import { createDefinedByExclusion } from '../../services/utils';
import { Uri } from '../../services/uri';

import { module as mod }  from './module';

mod.directive('uriSelect', () => {
  return {
    scope: {
      uri: '=',
      type: '@',
      model: '=',
      id: '@',
      afterSelected: '&',
      mandatory: '='
    },
    restrict: 'E',
    controllerAs: 'ctrl',
    bindToController: true,
    template: require('./uriSelect.html'),
    require: '?^form',
    link($scope: EditableScope, element: JQuery, attributes: IAttributes, formController: EditableForm) {
      $scope.formController = formController;
    },
    controller: UriSelectController
  };
});

interface EditableScope extends IScope {
  formController: EditableForm;
}

interface WithId {
  id: Uri;
}

class UriSelectController {

  uri: Uri;
  type: Type;
  model: Model;
  id: string;
  afterSelected: ICompiledExpression;
  mandatory: boolean;

  private change: Uri;

  constructor($scope: IScope, private searchPredicateModal: SearchPredicateModal, private searchClassModal: SearchClassModal) {
    $scope.$watch(() => this.uri, (current, previous) => {
      if (!!current && !current.equals(previous)) {
        this.change = current;
      }
    });
  }

  handleChange() {
    if (this.change) {
      this.afterSelected({id: this.change});
      this.change = null;
    }
  }

  selectUri() {
    const promise: IPromise<WithId> = this.type === 'class'
      ? this.searchClassModal.openWithOnlySelection(this.model, createDefinedByExclusion(this.model))
      : this.searchPredicateModal.openWithOnlySelection(this.model, this.type, createDefinedByExclusion(this.model));

    promise.then(withId => {
      this.uri = withId.id;
      this.afterSelected({id: withId.id});
    });
  }
}
