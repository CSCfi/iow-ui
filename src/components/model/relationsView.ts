import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import { Relation, Model } from '../../services/entities';
import { AddEditRelationModal } from './addEditRelationModal';
import { LanguageService } from '../../services/languageService';
import { TableDescriptor, ColumnDescriptor } from '../form/editableTable';
import { ModelViewController } from './modelView';
import { module as mod }  from './module';

mod.directive('relationsView', () => {
  return {
    scope: {
      model: '='
    },
    restrict: 'E',
    template: `
      <h4>
        <span translate>Related resources</span> 
        <button type="button" class="btn btn-default btn-xs pull-right" ng-click="ctrl.addRelation()" ng-show="ctrl.isEditing()">
          <span class="glyphicon glyphicon-plus"></span>
          <span translate>Add related resource</span>
        </button>
      </h4>
      <editable-table descriptor="ctrl.descriptor" values="ctrl.model.relations" expanded="ctrl.expanded"></editable-table>
    `,
    controllerAs: 'ctrl',
    bindToController: true,
    require: ['relationsView', '?^modelView'],
    link($scope: IScope, element: JQuery, attributes: IAttributes, [thisController, modelViewController]: [RelationsViewController, ModelViewController]) {
      thisController.isEditing = () => !modelViewController || modelViewController.isEditing();
    },
    controller: RelationsViewController
  };
});

class RelationsViewController {

  model: Model;
  isEditing: () => boolean;

  descriptor: RelationTableDescriptor;
  expanded = false;

  constructor($scope: IScope, private addEditRelationModal: AddEditRelationModal, private languageService: LanguageService) {
    $scope.$watch(() => this.model, model => {
      this.descriptor = new RelationTableDescriptor(addEditRelationModal, model, languageService);
    });
  }

  addRelation() {
    this.addEditRelationModal.openAdd(this.model, this.languageService.getModelLanguage(this.model))
      .then((relation: Relation) => {
        this.model.addRelation(relation);
        this.expanded = true;
      });
  }
}

class RelationTableDescriptor extends TableDescriptor<Relation> {

  constructor(private addEditRelationModal: AddEditRelationModal, private model: Model, private languageService: LanguageService) {
    super();
  }

  columnDescriptors(values: Relation[]): ColumnDescriptor<Relation>[] {
    return [
      { headerName: 'Title', nameExtractor: relation => this.languageService.translate(relation.title, this.model), hrefExtractor: relation => relation.homepage.uri },
      { headerName: 'Description', nameExtractor: relation => this.languageService.translate(relation.description, this.model) }
    ];
  }

  hasOrder() {
    return true;
  }

  edit(relation: Relation) {
    this.addEditRelationModal.openEdit(relation, this.model, this.languageService.getModelLanguage(this.model));
  }

  canEdit(relation: Relation): boolean {
    return true;
  }

  canRemove(relation: Relation): boolean {
    return true;
  }
}
