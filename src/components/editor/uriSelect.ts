import { IAttributes, ICompiledExpression, IPromise, IScope, IQService } from 'angular';
import { SearchPredicateModal } from './searchPredicateModal';
import { SearchClassModal } from './searchClassModal';
import { EditableForm } from '../form/editableEntityController';
import { Model, PredicateListItem, ClassListItem, ClassType, KnownPredicateType } from '../../services/entities';
import { Uri } from '../../services/uri';
import { module as mod }  from './module';
import { DataSource } from '../form/dataSource';
import { ClassService } from '../../services/classService';
import { PredicateService } from '../../services/predicateService';
import { itemExclusion, idExclusion } from '../../utils/exclusion';

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
      excludeItem: '=?',
      defaultToCurrentModel: '='
    },
    restrict: 'E',
    controllerAs: 'ctrl',
    bindToController: true,
    template: `
      <autocomplete datasource="ctrl.datasource" value-extractor="ctrl.valueExtractor" exclude-provider="ctrl.createItemExclusion">
        <input id="{{ctrl.id}}"
               type="text"
               class="form-control"
               uri-input
               exclude-validator="ctrl.createIdExclusion"
               ng-required="ctrl.mandatory"
               model="ctrl.model"
               ng-model="ctrl.uri"
               ng-blur="ctrl.handleChange()"
               autocomplete="off" />
      </autocomplete>

      <button ng-if="formController.editing" type="button" class="btn btn-default btn-sm" ng-click="ctrl.selectUri()">{{('Choose ' + ctrl.type) | translate}}</button>
    `,
    require: '?^form',
    link($scope: EditableScope, _element: JQuery, _attributes: IAttributes, formController: EditableForm) {
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
  type: ClassType|KnownPredicateType;
  model: Model;
  id: string;
  afterSelected: ICompiledExpression;
  mandatory: boolean;
  duplicate: (uri: Uri) => boolean;
  defaultToCurrentModel: boolean;
  datasource: DataSource<DataType>;
  valueExtractor = (item: DataType) => item.id;
  excludeId: (id: Uri) => string;
  excludeItem: (item: DataType) => string;

  createIdExclusion = () => idExclusion(this.excludeId, this.excludeItem, this.datasource, this.$q);
  createItemExclusion = () => itemExclusion(this.excludeId, this.excludeItem);

  private change: Uri|null = null;

  constructor($scope: IScope, private $q: IQService, private searchPredicateModal: SearchPredicateModal, private searchClassModal: SearchClassModal, classService: ClassService, predicateService: PredicateService) {

    const modelProvider = () => this.model;
    this.datasource = this.type === 'class' || this.type === 'shape' ? classService.getClassesForModelDataSource(modelProvider)
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
    const promise: IPromise<DataType> = this.type === 'class' || this.type === 'shape'
      ? this.searchClassModal.openWithOnlySelection(this.model, this.defaultToCurrentModel || false, this.createItemExclusion())
      : this.searchPredicateModal.openWithOnlySelection(this.model, this.type, this.createItemExclusion());

    promise.then(result => {
      this.uri = result.id;
      this.afterSelected({id: result.id});
    });
  }
}
