import { IAttributes, ICompiledExpression, IPromise, IScope } from 'angular';
import { SearchPredicateModal } from './searchPredicateModal';
import { SearchClassModal } from './searchClassModal';
import { EditableForm } from '../form/editableEntityController';
import { Model, Type, PredicateListItem, ClassListItem } from '../../services/entities';
import { Uri } from '../../services/uri';
import { module as mod }  from './module';
import { DataSource } from '../form/dataSource';
import { ClassService } from '../../services/classService';
import { PredicateService } from '../../services/predicateService';

mod.directive('uriSelect', () => {
  return {
    scope: {
      uri: '=',
      type: '@',
      model: '=',
      id: '@',
      afterSelected: '&',
      mandatory: '=',
      excludeId: '=?',
      defaultToCurrentModel: '='
    },
    restrict: 'E',
    controllerAs: 'ctrl',
    bindToController: true,
    template: `
      <autocomplete datasource="ctrl.datasource" value-extractor="ctrl.valueExtractor" exclude-provider="ctrl.createExclusion">
        <input id="{{ctrl.id}}"
               type="text"
               class="form-control"
               uri-input
               exclude-validator="ctrl.excludeId"
               ng-required="ctrl.mandatory"
               model="ctrl.model"
               ng-model="ctrl.uri"
               ng-blur="ctrl.handleChange()"
               autocomplete="off" />
      </autocomplete>

      <button ng-if="formController.editing" type="button" class="btn btn-default btn-sm" ng-click="ctrl.selectUri()">{{('Choose ' + ctrl.type) | translate}}</button>
    `,
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

type DataType = ClassListItem|PredicateListItem;

class UriSelectController {

  uri: Uri;
  type: Type;
  model: Model;
  id: string;
  afterSelected: ICompiledExpression;
  mandatory: boolean;
  duplicate: (uri: Uri) => boolean;
  defaultToCurrentModel: boolean;
  datasource: DataSource<DataType>;
  valueExtractor = (item: DataType) => item.id;
  excludeId: (id: Uri) => string;
  createExclusion = () => (item: DataType) => this.excludeId && this.excludeId(item.id);

  private change: Uri;

  constructor($scope: IScope, private searchPredicateModal: SearchPredicateModal, private searchClassModal: SearchClassModal, classService: ClassService, predicateService: PredicateService) {

    const modelProvider = () => this.model;
    this.datasource = this.type === 'class' ? classService.getClassesForModelDataSource(modelProvider)
                                            : predicateService.getPredicatesForModelDataSource(modelProvider);

    $scope.$watch(() => this.uri, (current, previous) => {
      if (!current || !current.equals(previous)) {
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
    const promise: IPromise<DataType> = this.type === 'class'
      ? this.searchClassModal.openWithOnlySelection(this.model, this.defaultToCurrentModel || false, this.createExclusion())
      : this.searchPredicateModal.openWithOnlySelection(this.model, this.type, this.createExclusion());

    promise.then(result => {
      this.uri = result.id;
      this.afterSelected({id: result.id});
    });
  }
}
