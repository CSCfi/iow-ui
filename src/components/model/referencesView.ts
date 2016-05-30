import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import { ModelViewController } from './modelView';
import { Vocabulary, Model } from '../../services/entities';
import { LanguageService } from '../../services/languageService';
import { TableDescriptor, ColumnDescriptor } from '../form/editableTable';
import { SearchReferenceModal } from './searchReferenceModal';
import { ModelService } from '../../services/modelService';
import { module as mod }  from './module';
import { createExistsExclusion } from '../../utils/exclusion';
import { collectProperties } from '../../utils/entity';
import { ConceptEditorModal } from './conceptEditorModal';

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
        <button type="button" class="btn btn-link btn-xs pull-right" ng-click="ctrl.browseConcepts()">
          <span class="fa fa-th"></span>
          <span translate>Browse concepts</span>
        </button>
      </h4>
      <editable-table descriptor="ctrl.descriptor" values="ctrl.model.vocabularies" expanded="ctrl.expanded"></editable-table>
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
  constructor($scope: IScope,
              private searchReferenceModal: SearchReferenceModal,
              private conceptEditorModal: ConceptEditorModal,
              private modelService: ModelService,
              private languageService: LanguageService) {
    $scope.$watch(() => this.model, model => {
      this.descriptor = new ReferenceTableDescriptor(model, languageService);
    });
  }

  browseConcepts() {
    this.conceptEditorModal.open(this.model);
  }

  addReference() {
    const language = this.languageService.getModelLanguage(this.model);
    const vocabularies = collectProperties(this.model.vocabularies, reference => reference.vocabularyId);
    const exclude = createExistsExclusion(vocabularies);

    this.searchReferenceModal.open(language, exclude)
      .then((scheme: any) => this.modelService.newReference(scheme, language, this.model.context))
      .then((reference: Vocabulary) => {
        this.model.addVocabulary(reference);
        this.expanded = true;
      });
  }
}

class ReferenceTableDescriptor extends TableDescriptor<Vocabulary> {

  constructor(private model: Model, private languageService: LanguageService) {
    super();
  }

  columnDescriptors(references: Vocabulary[]): ColumnDescriptor<Vocabulary>[] {
    return [
      { headerName: 'Identifier', nameExtractor: reference => reference.vocabularyId, cssClass: 'prefix', hrefExtractor: reference => reference.href},
      { headerName: 'Vocabulary name', nameExtractor: reference => this.languageService.translate(reference.label, this.model)}
    ];
  }

  canEdit(reference: Vocabulary): boolean {
    return false;
  }

  canRemove(reference: Vocabulary): boolean {
    return !reference.local;
  }

  orderBy(reference: Vocabulary): any {
    return reference.id;
  }

  filter(reference: Vocabulary) {
    return !reference.local;
  }
}
