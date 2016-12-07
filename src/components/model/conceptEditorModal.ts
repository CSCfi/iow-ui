import { IScope, ui } from 'angular';
import IModalService = ui.bootstrap.IModalService;
import IModalServiceInstance = ui.bootstrap.IModalServiceInstance;
import gettextCatalog = angular.gettext.gettextCatalog;
import { LanguageService, Localizer } from '../../services/languageService';
import { comparingLocalizable } from '../../utils/comparators';
import { ConfirmationModal } from '../common/confirmationModal';
import { ConceptViewController } from './conceptView';
import { Uri } from '../../entities/uri';
import { localizableContains } from '../../utils/language';
import * as _ from 'lodash';
import { Model } from '../../entities/model';
import { Concept, Vocabulary, LegacyConcept } from '../../entities/vocabulary';
import { DefinedBy } from '../../entities/definedBy';
import { VocabularyService } from '../../services/vocabularyService';
import { any } from '../../utils/array';
import { isConcept } from '../../utils/entity';

export class ConceptEditorModal {

  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(model: Model) {
    return this.$uibModal.open({
      template: require('./conceptEditorModal.html'),
      size: 'large',
      controller: ConceptEditorModalController,
      controllerAs: 'ctrl',
      backdrop: 'static',
      resolve: {
        model: () => model
      }
    }).result;
  }
}

export class ConceptEditorModalController {

  concepts: (Concept|LegacyConcept)[] = [];
  searchResults: (Concept|LegacyConcept)[] = [];
  selection: Concept|LegacyConcept;

  vocabularies: Vocabulary[] = [];
  showModel: DefinedBy;
  showVocabulary: Vocabulary;
  showConceptType: 'concept'|'conceptSuggestion';
  searchText: string = '';

  loadingResults: boolean;
  editInProgress = () => this.view.isEditing();

  view: ConceptViewController;
  private localizer: Localizer;

  /* @ngInject */
  constructor($scope: IScope,
              private $uibModalInstance: IModalServiceInstance,
              languageService: LanguageService,
              public gettextCatalog: gettextCatalog,
              vocabularyService: VocabularyService,
              private confirmationModal: ConfirmationModal,
              public model: Model) {

    this.localizer = languageService.createLocalizer(model);
    this.loadingResults = true;

    vocabularyService.getConceptsForModel(model)
      .then(concepts => {
        this.concepts = concepts;

        this.vocabularies = _.chain(concepts)
          .map(concept => concept.vocabularies)
          .flatten<Vocabulary|Uri>()
          .filter(vocabulary => vocabulary instanceof Vocabulary)
          .map(vocabulary => vocabulary as Vocabulary)
          .uniqBy(vocabulary => vocabulary.internalId)
          .value();

        this.sort();
        this.search();
        this.loadingResults = false;
      });

    $scope.$watch(() => this.localizer.language, () => this.sort());
    $scope.$watch(() => this.searchText, () => this.search());
    $scope.$watch(() => this.showModel, () => this.search());
    $scope.$watch(() => this.showVocabulary, () => this.search());
    $scope.$watch(() => this.showConceptType, () => this.search());

    $scope.$on('modal.closing', event => {
      if (this.editInProgress()) {
        event.preventDefault();
        this.confirmationModal.openEditInProgress().then(() => {
          this.view.cancelEditing();
          this.$uibModalInstance.close();
        });
      }
    });
  }

  sort() {
    const labelComparator = comparingLocalizable<Concept|LegacyConcept>(this.localizer, definedBy => definedBy.label);
    this.concepts.sort(labelComparator);
  }

  getConceptIndex(concept: Concept) {
    for (let i = 0; i < this.concepts.length; i++) {
      if (this.concepts[i].id.equals(concept.id)) {
        return i;
      }
    }

    throw new Error('Concept not found ' + concept.id.compact);
  }

  selectionEdited(concept: Concept) {
    this.concepts.splice(this.getConceptIndex(concept), 1, concept);
    this.sort();
    this.search();
  }

  selectionDeleted(concept: Concept) {
    this.concepts.splice(this.getConceptIndex(concept), 1);
    this.search();
  }

  registerView(view: ConceptViewController) {
    this.view = view;
  }

  search() {
    this.searchResults = this.concepts.filter(concept =>
      this.textFilter(concept) &&
      this.vocabularyFilter(concept) &&
      this.conceptTypeFilter(concept)
    );
  }

  private textFilter(concept: Concept|LegacyConcept): boolean {
    return !this.searchText || localizableContains(concept.label, this.searchText);
  }

  private vocabularyFilter(concept: Concept|LegacyConcept): boolean {
    return !this.showVocabulary || isConcept(concept) && any(concept.vocabularies, v => v.internalId === this.showVocabulary.internalId);
  }

  private conceptTypeFilter(concept: Concept|LegacyConcept): boolean {
    return !this.showConceptType
      || this.showConceptType === 'conceptSuggestion' && concept.suggestion
      || this.showConceptType === 'concept' && !concept.suggestion;
  }

  selectItem(item: Concept) {
    this.view.cancelEditing();
    this.selection = item;
  }

  close() {
    this.$uibModalInstance.close();
  }
}

