import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import { ModelViewController } from './modelView';
import { Vocabulary, Model } from '../../services/entities';
import { LanguageService } from '../../services/languageService';
import { TableDescriptor, ColumnDescriptor } from '../form/editableTable';
import { SearchVocabularyModal } from './searchVocabularyModal';
import { ModelService } from '../../services/modelService';
import { module as mod }  from './module';
import { createExistsExclusion } from '../../utils/exclusion';
import { collectProperties } from '../../utils/entity';
import { ConceptEditorModal } from './conceptEditorModal';

mod.directive('vocabulariesView', () => {
  return {
    scope: {
      model: '='
    },
    restrict: 'E',
    template: `
      <h4>
        <span translate>References</span> 
        <button type="button" class="btn btn-link btn-xs pull-right" ng-click="ctrl.addVocabulary()" ng-show="ctrl.isEditing()">
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
    require: ['vocabulariesView', '?^modelView'],
    link($scope: IScope, element: JQuery, attributes: IAttributes, [thisController, modelViewController]: [VocabulariesViewController, ModelViewController]) {
      thisController.isEditing = () => !modelViewController || modelViewController.isEditing();
    },
    controller: VocabulariesViewController
  };
});

class VocabulariesViewController {

  model: Model;
  isEditing: () => boolean;

  descriptor: VocabularyTableDescriptor;
  expanded: boolean;

  /* @ngInject */
  constructor($scope: IScope,
              private searchVocabularyModal: SearchVocabularyModal,
              private conceptEditorModal: ConceptEditorModal,
              private modelService: ModelService,
              private languageService: LanguageService) {
    $scope.$watch(() => this.model, model => {
      this.descriptor = new VocabularyTableDescriptor(model, languageService);
    });
  }

  browseConcepts() {
    this.conceptEditorModal.open(this.model);
  }

  addVocabulary() {
    const language = this.languageService.getModelLanguage(this.model);
    const vocabularies = collectProperties(this.model.vocabularies, vocabulary => vocabulary.vocabularyId);
    const exclude = createExistsExclusion(vocabularies);

    this.searchVocabularyModal.open(language, exclude)
      .then((scheme: any) => this.modelService.newVocabulary(scheme, language, this.model.context))
      .then((vocabulary: Vocabulary) => {
        this.model.addVocabulary(vocabulary);
        this.expanded = true;
      });
  }
}

class VocabularyTableDescriptor extends TableDescriptor<Vocabulary> {

  constructor(private model: Model, private languageService: LanguageService) {
    super();
  }

  columnDescriptors(vocabularies: Vocabulary[]): ColumnDescriptor<Vocabulary>[] {
    return [
      { headerName: 'Identifier', nameExtractor: vocabualry => vocabualry.vocabularyId, cssClass: 'prefix', hrefExtractor: vocabulary => vocabulary.href},
      { headerName: 'Vocabulary name', nameExtractor: vocabulary => this.languageService.translate(vocabulary.label, this.model)}
    ];
  }

  canEdit(vocabulary: Vocabulary): boolean {
    return false;
  }

  canRemove(vocabulary: Vocabulary): boolean {
    return !vocabulary.local;
  }

  orderBy(vocabulary: Vocabulary): any {
    return vocabulary.id;
  }

  filter(vocabluary: Vocabulary) {
    return !vocabluary.local;
  }
}
