import { IAttributes, IPromise, IScope } from 'angular';
import { SearchPredicateModal } from './searchPredicateModal';
import { Model, Type, ClassListItem, PredicateListItem } from '../../services/entities';
import { SearchClassModal } from './searchClassModal';
import { Uri } from '../../services/uri';
import { module as mod }  from './module';
import gettextCatalog = angular.gettext.gettextCatalog;
import { EditableForm } from '../form/editableEntityController';
import { collectProperties } from '../../utils/array';
import { createExistsExclusion, createDefinedByExclusion, combineExclusions } from '../../utils/exclusion';
import { DataSource } from '../form/dataSource';
import { ClassService } from '../../services/classService';
import { PredicateService } from '../../services/predicateService';

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
          <autocomplete datasource="ctrl.datasource" value-extractor="ctrl.valueExtractor">
            <input id="{{ctrl.id}}"
                   type="text"
                   restrict-duplicates="ctrl.ngModel"
                   uri-input
                   model="ctrl.model"
                   ng-model="ctrl.input" />
          </autocomplete>
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

type DataType = ClassListItem|PredicateListItem;

class EditableMultipleUriSelectController {

  ngModel: Uri[];
  input: Uri;
  type: Type;
  model: Model;
  id: string;
  title: string;
  link = (uri: Uri) => this.model.linkToResource(uri);

  isEditing: () => boolean;
  addUri: (uri: Uri) => void;
  datasource: DataSource<DataType>;
  valueExtractor = (item: DataType) => item.id;

  /* @ngInject */
  constructor(private searchPredicateModal: SearchPredicateModal, private searchClassModal: SearchClassModal, classService: ClassService, predicateService: PredicateService) {
    const modelProvider = () => this.model;
    this.datasource = this.type === 'class' ? classService.getClassesForModelDataSource(modelProvider, this.createExclusion.bind(this))
                                            : predicateService.getPredicatesForModelDataSource(modelProvider, this.createExclusion.bind(this));
  }

  private createExclusion<T extends DataType>() {
    const existsExclusion = createExistsExclusion(collectProperties(this.ngModel, uri => uri.uri));
    const definedExclusion = createDefinedByExclusion(this.model);
    return combineExclusions<T>(existsExclusion, definedExclusion);
  }

  selectUri() {
    const promise: IPromise<DataType> = this.type === 'class'
      ? this.searchClassModal.openWithOnlySelection(this.model, false, this.createExclusion())
      : this.searchPredicateModal.openWithOnlySelection(this.model, this.type, this.createExclusion());

    promise.then(result => {
      this.ngModel.push(result.id);
    });
  }
}
