import IScope = angular.IScope;
import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IPromise = angular.IPromise;
import IQService = angular.IQService;
import * as _ from 'lodash';
import gettextCatalog = angular.gettext.gettextCatalog;
import { ConceptService, ConceptSearchResult } from '../../services/conceptService';
import { LanguageService } from '../../services/languageService';
import { ImportedVocabulary, ConceptSuggestion, Type, FintoConcept, Model, Concept } from '../../services/entities';
import { comparingString, comparingBoolean, comparingLocalizable } from '../../services/comparators';
import { EditableForm } from '../form/editableEntityController';
import { AddNew } from '../common/searchResults';
import { Uri } from '../../services/uri';
import { isDefined } from '../../utils/object';
import { any } from '../../utils/array';

const limit = 1000;

export interface NewEntityData {
  label: string;
};

export class EntityCreation {
  constructor(public concept: Concept, public entity: NewEntityData) {
  }
}

class NewConceptData {
  comment: string;
  broaderConcept: Concept;

  constructor(public label: string, public vocabulary: ImportedVocabulary) {
  }
}

export class SearchConceptModal {

  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  private open(vocabularies: ImportedVocabulary[], model: Model, type: Type, newEntityCreation: boolean, initialSearch: string) {
    return this.$uibModal.open({
      template: require('./searchConceptModal.html'),
      size: 'large',
      controller: SearchConceptController,
      controllerAs: 'ctrl',
      backdrop: true,
      resolve: {
        vocabularies: () => vocabularies,
        model: () => model,
        type: () => type,
        newEntityCreation: () => newEntityCreation,
        initialSearch: () => initialSearch
      }
    }).result;
  }

  openSelection(vocabularies: ImportedVocabulary[], model: Model, type?: Type): IPromise<Concept> {
    return this.open(vocabularies, model, type, false, '');
  }

  openNewEntityCreation(vocabularies: ImportedVocabulary[], model: Model, type: Type, initialSearch: string): IPromise<EntityCreation> {
    return this.open(vocabularies, model, type, true, initialSearch);
  }
};

export interface SearchPredicateScope extends IScope {
  form: EditableForm;
}

function isConcept(obj: Concept|NewConceptData): obj is Concept {
  return obj instanceof FintoConcept || obj instanceof ConceptSuggestion;
}

function isNewConceptData(obj: Concept|NewConceptData): obj is NewConceptData {
  return obj instanceof NewConceptData;
}

class SearchConceptController {

  close = this.$uibModalInstance.dismiss;
  queryResults: ConceptSearchResult[];
  searchResults: (ConceptSearchResult|AddNewConcept)[];
  selection: Concept|NewConceptData;
  defineConceptTitle: string;
  buttonTitle: string;
  labelTitle: string;
  selectedVocabulary: ImportedVocabulary;
  searchText: string = '';
  submitError: string;
  editInProgress = () => this.$scope.form.$dirty;
  loadingResults: boolean;
  selectedItem: ConceptSearchResult|AddNewConcept;
  vocabularies: ImportedVocabulary[];
  selectableVocabularies: ImportedVocabulary[];

  /* @ngInject */
  constructor(private $scope: SearchPredicateScope,
              private $uibModalInstance: IModalServiceInstance,
              private $q: IQService,
              private languageService: LanguageService,
              public type: Type,
              initialSearch: string,
              public newEntityCreation: boolean,
              vocabularies: ImportedVocabulary[],
              private model: Model,
              private conceptService: ConceptService,
              private gettextCatalog: gettextCatalog,
              private searchConceptModal: SearchConceptModal) {

    this.defineConceptTitle = type ? `Define concept for the ${newEntityCreation ? 'new ' : ''}${type}` : 'Search concept';
    this.buttonTitle = (newEntityCreation ? 'Create new ' + type : 'Use');
    this.labelTitle = `${_.capitalize(this.type)} label`;
    this.searchText = initialSearch;
    this.vocabularies = vocabularies.slice();
    this.vocabularies.sort(this.vocabularyComparator);
    this.loadingResults = true;

    $scope.$watch(() => this.searchText, text => this.query(text).then(() => this.search()));
    $scope.$watch(() => this.selectedVocabulary, () => this.query(this.searchText).then(() => this.search()));
    $scope.$watch(() => this.queryResults, results => {
      if (results) {
        this.selectableVocabularies = _.filter(vocabularies, vocabulary => {
          for (const concept of results) {
            const exactMatch = this.localizedLabelAsLower(concept) === this.searchText.toLowerCase();
            if (exactMatch && concept.vocabulary.id.equals(vocabulary.id)) {
              return false;
            }
          }
          return true;
        });

        this.selectableVocabularies.sort(this.vocabularyComparator);
      }
    });
  }

  translateVocabulary(vocabulary: ImportedVocabulary) {
    if (vocabulary.local) {
      return this.gettextCatalog.getString('Internal vocabulary');
    } else {
      return this.languageService.translate(vocabulary.label, this.model);
    }
  }

  get vocabularyComparator() {
    return comparingBoolean<ImportedVocabulary>(vocabulary => !vocabulary.local)
      .andThen(comparingLocalizable<ImportedVocabulary>(this.languageService.UILanguage, vocabulary => vocabulary.label));
  }

  isSelectionConcept() {
    return isConcept(this.selection);
  }

  isSelectionNewConceptData() {
    return isNewConceptData(this.selection);
  }

  get activeVocabularies() {
    return this.selectedVocabulary ? [this.selectedVocabulary] : this.vocabularies;
  }

  query(searchText: string): IPromise<any> {
    this.loadingResults = true;
    const language = this.languageService.getModelLanguage(this.model);

    if (searchText && searchText.length >= 3) {
      return this.$q.all(_.flatten(_.map(this.activeVocabularies, vocabulary => this.conceptService.searchConcepts(vocabulary, language, searchText))))
        .then((results: ConceptSearchResult[][]) => this.queryResults = _.take(_.flatten(results), limit));
    } else {
      return this.$q.when(this.queryResults = []);
    }
  }

  search() {
    if (this.queryResults) {

      const suggestText = `${this.gettextCatalog.getString('suggest')} '${this.searchText}'`;
      const toVocabularyText = `${this.gettextCatalog.getString('to vocabulary')}`;
      const result: (ConceptSearchResult|AddNewConcept)[] = [new AddNewConcept(suggestText + ' ' + toVocabularyText, () => this.canAddNew())];

      const conceptSearchResult = this.queryResults.filter(concept =>
        this.showVocabularyFilter(concept)
      );

      conceptSearchResult.sort(
          comparingString(this.localizedLabelAsLower.bind(this))
            .andThen(comparingBoolean((item: ConceptSearchResult) => item.suggestion)));

      this.searchResults = result.concat(conceptSearchResult);
    } else {
      this.searchResults = [];
    }

    this.loadingResults = !isDefined(this.queryResults);
  }

  private localizedLabelAsLower(concept: ConceptSearchResult): string {
    return this.languageService.translate(concept.label, this.model).toLowerCase();
  }

  private showVocabularyFilter(concept: ConceptSearchResult) {
    return any(this.activeVocabularies, vocabulary => concept.vocabulary.id.equals(vocabulary.id));
  }

  selectItem(item: ConceptSearchResult|AddNewConcept) {

    this.selectedItem = item;
    this.submitError = null;
    this.$scope.form.$setPristine();

    if (item instanceof AddNewConcept) {
      this.selection = new NewConceptData(this.searchText, this.resolveInitialVocabulary());
    } else {
      const conceptSearchResult: ConceptSearchResult = <ConceptSearchResult> item;
      const conceptPromise: IPromise<Concept> = conceptSearchResult.suggestion
        ? this.conceptService.getConceptSuggestion(conceptSearchResult.id)
        : this.conceptService.getFintoConcept(conceptSearchResult.id);

      conceptPromise.then(concept => this.selection = concept);
    }
  }

  loadingSelection(item: ConceptSearchResult|AddNew) {
    if (item instanceof AddNew || item !== this.selectedItem) {
      return false;
    } else {
      if (!this.selection) {
        return true;
      } else {
        const searchResult = <ConceptSearchResult> item;
        const selection = this.selection;
        return isConcept(selection) && !searchResult.id.equals(selection.id);
      }
    }
  }

  selectBroaderConcept() {
    const selection = this.selection;
    if (isNewConceptData(selection)) {
      this.searchConceptModal.openSelection(this.activeVocabularies, this.model)
        .then(concept => selection.broaderConcept = concept);
    } else {
      throw new Error('Selection must be new concept data: ' + selection);
    }
  }

  resolveInitialVocabulary() {
    for (const vocabulary of this.selectableVocabularies) {
      if (vocabulary.local) {
        return vocabulary;
      }
    }

    return this.selectableVocabularies[0];
  }

  canAddNew() {
    return !!this.searchText && this.selectableVocabularies.length > 0;
  }

  confirm() {
    this.$uibModalInstance.close(this.resolveResult());
  }

  private resolveResult(): IPromise<Concept|EntityCreation> {

    function extractId(entity: {id: Uri}) {
      return entity && entity.id;
    }

    function newEntity(concept: Concept) {
      return { label: concept.label[language] };
    }

    const selection = this.selection;
    const language = this.languageService.getModelLanguage(this.model);

    if (isNewConceptData(selection)) {

      const conceptSuggestion = this.conceptService.createConceptSuggestion(selection.vocabulary, selection.label, selection.comment, extractId(selection.broaderConcept), language, this.model)
        .then(conceptId => this.conceptService.getConceptSuggestion(conceptId));

      if (this.newEntityCreation) {
        return conceptSuggestion.then(cs => new EntityCreation(cs, newEntity(cs)));
      } else {
        return conceptSuggestion;
      }
    } else if (isConcept(selection)) {
      if (this.newEntityCreation) {
        return this.$q.when(new EntityCreation(selection, newEntity(selection)));
      } else {
        return this.$q.when(selection);
      }
    } else {
      throw new Error('Unsupported selection ' + selection);
    }
  }
}

class AddNewConcept extends AddNew {
  constructor(public label: string, public show: () => boolean) {
    super(label, show);
  }
}
