import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import { ModelViewController } from './modelView';
import { Reference, Model } from '../../services/entities';
import { LanguageService } from '../../services/languageService';
import { TableDescriptor, ColumnDescriptor } from '../form/editableTable';
import { SearchReferenceModal } from './searchReferenceModal';
import { ModelService } from '../../services/modelService';
import { module as mod }  from './module';
import { createExistsExclusion } from '../../utils/exclusion';
import { collectProperties } from '../../utils/entity';

mod.directive('referencesView', () => {
  return {
    scope: {
      model: '='
    },
    restrict: 'E',
    template: `
      <h4>
        <span translate>References</span> 
        <button type="button" class="btn btn-link btn-xs pull-right" ng-click="ctrl.addReference()" ng-show="ctrl.isEditing()">
          <span class="glyphicon glyphicon-plus"></span>
          <span translate>Add reference</span>
        </button>
      </h4>
      <editable-table descriptor="ctrl.descriptor" values="ctrl.model.references" expanded="ctrl.expanded"></editable-table>
    `,
    controllerAs: 'ctrl',
    bindToController: true,
    require: ['referencesView', '?^modelView'],
    link($scope: IScope, element: JQuery, attributes: IAttributes, [thisController, modelViewController]: [ReferencesViewController, ModelViewController]) {
      thisController.isEditing = () => !modelViewController || modelViewController.isEditing();
    },
    controller: ReferencesViewController
  };
});

class ReferencesViewController {

  model: Model;
  isEditing: () => boolean;

  descriptor: ReferenceTableDescriptor;
  expanded: boolean;

  /* @ngInject */
  constructor($scope: IScope, private searchReferenceModal: SearchReferenceModal, private modelService: ModelService, private languageService: LanguageService) {
    $scope.$watch(() => this.model, model => {
      this.descriptor = new ReferenceTableDescriptor(model, languageService);
    });
  }

  addReference() {
    const language = this.languageService.getModelLanguage(this.model);
    const vocabularies = collectProperties(this.model.references, reference => reference.vocabularyId);
    const exclude = createExistsExclusion(vocabularies);

    this.searchReferenceModal.open(language, exclude)
      .then((scheme: any) => this.modelService.newReference(scheme, language, this.model.context))
      .then((reference: Reference) => {
        this.model.addReference(reference);
        this.expanded = true;
      });
  }
}

class ReferenceTableDescriptor extends TableDescriptor<Reference> {

  constructor(private model: Model, private languageService: LanguageService) {
    super();
  }

  columnDescriptors(references: Reference[]): ColumnDescriptor<Reference>[] {
    return [
      { headerName: 'Identifier', nameExtractor: reference => reference.vocabularyId, cssClass: 'prefix'},
      { headerName: 'Vocabulary name', nameExtractor: reference => this.languageService.translate(reference.label, this.model)}
    ];
  }

  canEdit(reference: Reference): boolean {
    return false;
  }

  canRemove(reference: Reference): boolean {
    return !reference.local;
  }

  orderBy(reference: Reference): any {
    return reference.id;
  }

  filter(reference: Reference) {
    return !reference.local;
  }
}
