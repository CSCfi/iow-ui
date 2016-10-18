import { IAttributes, IPromise, IScope } from 'angular';
import { SearchPredicateModal } from './searchPredicateModal';
import { SearchClassModal } from './searchClassModal';
import { Uri } from '../../entities/uri';
import { module as mod }  from './module';
import { EditableForm } from '../form/editableEntityController';
import { collectProperties } from '../../utils/array';
import { createExistsExclusion } from '../../utils/exclusion';
import { DataSource } from '../form/dataSource';
import { ClassService } from '../../services/classService';
import { PredicateService } from '../../services/predicateService';
import { ClassListItem } from '../../entities/class';
import { PredicateListItem } from '../../entities/predicate';
import { ClassType, KnownPredicateType } from '../../entities/type';
import { Model } from '../../entities/model';

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
          <autocomplete datasource="ctrl.datasource" value-extractor="ctrl.valueExtractor" exclude-provider="ctrl.createExclusion">
            <input id="{{ctrl.id}}"
                   type="text"
                   restrict-duplicates="ctrl.ngModel"
                   uri-input
                   ignore-form
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
    link(_$scope: IScope, _element: JQuery, _attributes: IAttributes, [thisController, formController]: [EditableMultipleUriSelectController, EditableForm]) {
      thisController.isEditing = () => formController.editing;
    },
    controller: EditableMultipleUriSelectController
  };
});

type DataType = ClassListItem|PredicateListItem;

class EditableMultipleUriSelectController {

  ngModel: Uri[];
  input: Uri;
  type: ClassType|KnownPredicateType;
  model: Model;
  id: string;
  title: string;
  link = (uri: Uri) => this.model.linkToResource(uri);

  isEditing: () => boolean;
  addUri: (uri: Uri) => void;
  datasource: DataSource<DataType>;
  valueExtractor = (item: DataType) => item.id;
  createExclusion = () => createExistsExclusion(collectProperties(this.ngModel, uri => uri.uri));

  /* @ngInject */
  constructor(private searchPredicateModal: SearchPredicateModal, private searchClassModal: SearchClassModal, classService: ClassService, predicateService: PredicateService) {
    const modelProvider = () => this.model;
    this.datasource = this.type === 'class' ? classService.getClassesForModelDataSource(modelProvider)
                                            : predicateService.getPredicatesForModelDataSource(modelProvider);
  }

  selectUri() {
    const promise: IPromise<DataType> = this.type === 'class' || this.type === 'shape'
      ? this.searchClassModal.openWithOnlySelection(this.model, false, this.createExclusion())
      : this.searchPredicateModal.openWithOnlySelection(this.model, this.type, this.createExclusion());

    promise.then(result => {
      this.ngModel.push(result.id);
    });
  }
}
