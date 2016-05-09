import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import { ModelViewController } from './modelView';
import { Relation, Model } from '../../services/entities';
import { module as mod }  from './module';
import { AddEditRelationModal } from './addEditRelationModal';
import { LanguageService } from '../../services/languageService';
import { TableDescriptor, ColumnDescriptor } from '../form/editableTable';

mod.directive('relationsView', () => {
  return {
    scope: {
      model: '='
    },
    restrict: 'E',
    template: `
      <h4 translate>Related resources</h4>
      <editable-table descriptor="ctrl.descriptor" values="ctrl.model.relations" expanded="ctrl.expanded"></editable-table>
    `,
    controllerAs: 'ctrl',
    bindToController: true,
    require: ['relationsView', '?^modelView'],
    link($scope: IScope, element: JQuery, attributes: IAttributes, [thisController, modelViewController]: [RelationsViewController, ModelViewController]) {
      if (modelViewController) {
        modelViewController.registerRelationsView(thisController);
      }
    },
    controller: RelationsViewController
  };
});

class RelationsViewController {
  model: Model;
  descriptor: RelationTableDescriptor;
  expanded = false;

  constructor($scope: IScope, addEditRelationModal: AddEditRelationModal, languageService: LanguageService) {
    $scope.$watch(() => this.model, model => {
      this.descriptor = new RelationTableDescriptor(addEditRelationModal, model, languageService);
    });
  }

  open(relation: Relation) {
    this.expanded = true;
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
