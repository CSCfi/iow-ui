import { IScope, IPromise, IQService, ui } from 'angular';
import IModalService = ui.bootstrap.IModalService;
import IModalServiceInstance = ui.bootstrap.IModalServiceInstance;
import * as _ from 'lodash';
import gettextCatalog = angular.gettext.gettextCatalog;
import { ConceptService, ConceptSearchResult } from '../../services/conceptService';
import { LanguageService, Localizer } from '../../services/languageService';
import { Vocabulary, ConceptSuggestion, Type, FintoConcept, Model, Concept } from '../../services/entities';
import { comparingBoolean, comparingLocalizable } from '../../services/comparators';
import { EditableForm } from '../form/editableEntityController';
import { AddNew } from '../common/searchResults';
import { Uri } from '../../services/uri';
import { any, all } from '../../utils/array';
import { lowerCase } from 'change-case';
import { SearchController, SearchFilter } from '../filter/contract';
import { ifChanged } from '../../utils/angular';

const limit = 1000;

export interface NewEntityData {
  label: string;
}

export class EntityCreation {
  constructor(public concept: Concept, public entity: NewEntityData) {
  }
}

class NewConceptData {
  comment: string;
  broaderConcept: Concept;

  constructor(public label: string, public vocabulary: Vocabulary) {
  }
}

export class SearchConceptModal {

  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  private open(vocabularies: Vocabulary[], model: Model, type: Type|null, allowSuggestions: boolean, newEntityCreation: boolean, initialSearch: string) {
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
        initialSearch: () => initialSearch,
        allowSuggestions: () => allowSuggestions
      }
    }).result;
  }

  openSelection(vocabularies: Vocabulary[], model: Model, allowSuggestions: boolean, type?: Type): IPromise<Concept> {
    return this.open(vocabularies, model, type || null, allowSuggestions, false, '');
  }

  openNewEntityCreation(vocabularies: Vocabulary[], model: Model, type: Type, initialSearch: string): IPromise<EntityCreation> {
    return this.open(vocabularies, model, type, true, true, initialSearch);
  }
}

export interface SearchPredicateScope extends IScope {
  form: EditableForm;
}

function isConcept(obj: Concept|NewConceptData): obj is Concept {
  return obj instanceof FintoConcept || obj instanceof ConceptSuggestion;
}

function isNewConceptData(obj: Concept|NewConceptData): obj is NewConceptData {
  return obj instanceof NewConceptData;
}

class SearchConceptController implements SearchController<ConceptSearchResult> {

  close = this.$uibModalInstance.dismiss;
  queryResults: ConceptSearchResult[];
  searchResults: (ConceptSearchResult|AddNewConcept)[];
  selection: Concept|NewConceptData;
  defineConceptTitle: string;
  buttonTitle: string;
  labelTitle: string;
  selectedVocabulary: Vocabulary;
  searchText: string = '';
  submitError: string|null = null;
  editInProgress = () => this.$scope.form.$dirty;
  loadingResults: boolean;
  selectedItem: ConceptSearchResult|AddNewConcept;
  vocabularies: Vocabulary[];
  selectableVocabularies: Vocabulary[];
  private localizer: Localizer;

  contentExtractors = [ (concept: ConceptSearchResult) => concept.label ];
  private searchFilters: SearchFilter<ConceptSearchResult>[] = [];

  /* @ngInject */
  constructor(private $scope: SearchPredicateScope,
              private $uibModalInstance: IModalServiceInstance,
              private $q: IQService,
              private languageService: LanguageService,
              public type: Type|null,
              initialSearch: string,
              public newEntityCreation: boolean,
              private allowSuggestions: boolean,
              vocabularies: Vocabulary[],
              private model: Model,
              private conceptService: ConceptService,
              private gettextCatalog: gettextCatalog) {

    this.localizer = languageService.createLocalizer(model);
    this.defineConceptTitle = type ? `Define concept for the ${newEntityCreation ? 'new ' : ''}${type}` : 'Search concept';
    this.buttonTitle = (newEntityCreation ? 'Create new ' + type : 'Use');
    this.labelTitle = type ? `${_.capitalize(type)} label` : '';
    this.searchText = initialSearch;
    this.vocabularies = vocabularies.slice();
    this.vocabularies.sort(this.vocabularyComparator);
    this.loadingResults = true;

    this.addFilter(concept =>
      any(this.activeVocabularies, vocabulary => concept.vocabulary.id.equals(vocabulary.id))
    );

    $scope.$watch(() => this.searchText, ifChanged(() => this.query(this.searchText).then(() => this.search())));
    $scope.$watch(() => this.selectedVocabulary, ifChanged(() => this.query(this.searchText).then(() => this.search())));
    $scope.$watch(() => this.localizer.language, ifChanged(() => this.query(this.searchText).then(() => this.search())));
    $scope.$watch(() => this.queryResults, results => {
      if (results) {
        this.selectableVocabularies = _.filter(vocabularies, vocabulary => {
          for (const concept of results) {
            const exactMatch = this.localizer.translate(concept.label).toLowerCase() === this.searchText.toLowerCase();
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

  addFilter(filter: SearchFilter<ConceptSearchResult>) {
    this.searchFilters.push(filter);
  }

  get items() {
    return this.queryResults;
  }

  translateVocabulary(vocabulary: Vocabulary) {
    if (vocabulary.local) {
      return this.gettextCatalog.getString('Internal vocabulary');
    } else {
      return this.languageService.translate(vocabulary.title, this.model);
    }
  }

  get vocabularyComparator() {
    return comparingBoolean<Vocabulary>(vocabulary => !vocabulary.local)
      .andThen(comparingLocalizable<Vocabulary>(this.localizer, vocabulary => vocabulary.title));
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
        .then((results: ConceptSearchResult[][]) => {
          this.queryResults = _.take(_.flatten(results), limit);

          this.queryResults.sort(
            comparingLocalizable<ConceptSearchResult>(this.localizer, item => item.label)
              .andThen(comparingBoolean<ConceptSearchResult>(item => item.suggestion)));

          this.loadingResults = false;
        });
    } else {
      this.loadingResults = false;
      return this.$q.when(this.queryResults = []);
    }
  }

  search() {
    if (this.queryResults) {

      const suggestText = `${this.gettextCatalog.getString('suggest')} '${this.searchText}'`;
      const toVocabularyText = `${this.gettextCatalog.getString('to vocabulary')}`;
      const result: (ConceptSearchResult|AddNewConcept)[] = [new AddNewConcept(suggestText + ' ' + toVocabularyText, () => this.canAddNew())];
      const conceptSearchResult = this.queryResults.filter(concept => all(this.searchFilters, filter => filter(concept)));

      this.searchResults = result.concat(conceptSearchResult);
    } else {
      this.searchResults = [];
    }
  }

  selectItem(item: ConceptSearchResult|AddNewConcept) {

    this.selectedItem = item;
    this.submitError = null;
    this.$scope.form.$setPristine();

    if (item instanceof AddNewConcept) {
      this.selection = new NewConceptData(lowerCase(this.searchText, this.localizer.language), this.resolveInitialVocabulary());
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

  resolveInitialVocabulary() {
    for (const vocabulary of this.selectableVocabularies) {
      if (vocabulary.local) {
        return vocabulary;
      }
    }

    return this.selectableVocabularies[0];
  }

  canAddNew() {
    return this.allowSuggestions && !!this.searchText && this.selectableVocabularies.length > 0;
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
