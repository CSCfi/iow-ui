import { IScope, IPromise, IQService, ui } from 'angular';
import IModalService = ui.bootstrap.IModalService;
import IModalServiceInstance = ui.bootstrap.IModalServiceInstance;
import gettextCatalog = angular.gettext.gettextCatalog;
import { LanguageService, Localizer } from '../../services/languageService';
import { comparingLocalizable } from '../../utils/comparators';
import { EditableForm } from '../form/editableEntityController';
import { AddNew } from '../common/searchResults';
import { Uri } from '../../entities/uri';
import { any, limit } from '../../utils/array';
import { lowerCase, upperCaseFirst } from 'change-case';
import { SearchController, SearchFilter } from '../filter/contract';
import { ifChanged } from '../../utils/angular';
import { Concept } from '../../entities/vocabulary';
import { Model, ModelVocabulary } from '../../entities/model';
import { ClassType, KnownPredicateType } from '../../entities/type';
import { VocabularyService } from '../../services/vocabularyService';
import { filterAndSortSearchResults, defaultLabelComparator } from '../filter/util';

const limitQueryResults = 1000;

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

  constructor(public label: string, public vocabulary: ModelVocabulary) {
  }
}

export class SearchConceptModal {

  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  private open(vocabularies: ModelVocabulary[], model: Model, type: ClassType|KnownPredicateType|null, allowSuggestions: boolean, newEntityCreation: boolean, initialSearch: string) {
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

  openSelection(vocabularies: ModelVocabulary[], model: Model, allowSuggestions: boolean, type?: ClassType|KnownPredicateType): IPromise<Concept> {
    return this.open(vocabularies, model, type || null, allowSuggestions, false, '');
  }

  openNewEntityCreation(vocabularies: ModelVocabulary[], model: Model, type: ClassType|KnownPredicateType, initialSearch: string): IPromise<EntityCreation> {
    return this.open(vocabularies, model, type, true, true, initialSearch);
  }
}

export interface SearchPredicateScope extends IScope {
  form: EditableForm;
}

function isConcept(obj: Concept|NewConceptData): obj is Concept {
  return obj instanceof Concept;
}

function isNewConceptData(obj: Concept|NewConceptData): obj is NewConceptData {
  return obj instanceof NewConceptData;
}

class SearchConceptController implements SearchController<Concept> {

  close = this.$uibModalInstance.dismiss;
  queryResults: Concept[];
  searchResults: (Concept|AddNewConcept)[];
  selection: Concept|NewConceptData;
  defineConceptTitle: string;
  buttonTitle: string;
  labelTitle: string;
  selectedVocabulary: ModelVocabulary;
  searchText: string = '';
  submitError: string|null = null;
  editInProgress = () => this.$scope.form.$dirty;
  loadingResults: boolean;
  selectedItem: Concept|AddNewConcept;
  vocabularies: ModelVocabulary[];
  private localizer: Localizer;

  contentExtractors = [ (concept: Concept) => concept.label ];
  private searchFilters: SearchFilter<Concept>[] = [];

  /* @ngInject */
  constructor(private $scope: SearchPredicateScope,
              private $uibModalInstance: IModalServiceInstance,
              private $q: IQService,
              private languageService: LanguageService,
              public type: ClassType|KnownPredicateType|null,
              initialSearch: string,
              public newEntityCreation: boolean,
              private allowSuggestions: boolean,
              vocabularies: ModelVocabulary[],
              private model: Model,
              private vocabularyService: VocabularyService,
              private gettextCatalog: gettextCatalog) {

    this.localizer = languageService.createLocalizer(model);
    this.defineConceptTitle = type ? `Define concept for the ${newEntityCreation ? 'new ' : ''}${type}` : 'Search concept';
    this.buttonTitle = (newEntityCreation ? 'Create new ' + type : 'Use');
    this.labelTitle = type ? `${upperCaseFirst(type)} label` : '';
    this.searchText = initialSearch;
    this.vocabularies = vocabularies.slice();
    this.vocabularies.sort(this.vocabularyComparator);
    this.loadingResults = false;

    this.addFilter(concept =>
      !this.selectedVocabulary || any(concept.item.vocabularies, v => v.internalId === this.selectedVocabulary.internalId)
    );

    $scope.$watch(() => this.searchText, () => this.query(this.searchText).then(() => this.search()));
    $scope.$watch(() => this.selectedVocabulary, ifChanged(() => this.query(this.searchText).then(() => this.search())));
    $scope.$watch(() => this.localizer.language, ifChanged(() => this.query(this.searchText).then(() => this.search())));
  }

  addFilter(filter: SearchFilter<Concept>) {
    this.searchFilters.push(filter);
  }

  get items() {
    return this.queryResults;
  }

  get vocabularyComparator() {
    return comparingLocalizable<ModelVocabulary>(this.localizer, vocabulary => vocabulary.title);
  }

  isSelectionConcept() {
    return isConcept(this.selection);
  }

  isSelectionNewConceptData() {
    return isNewConceptData(this.selection);
  }

  query(searchText: string): IPromise<any> {
    this.loadingResults = true;

    if (searchText) {
      return this.vocabularyService.searchConcepts(searchText, this.selectedVocabulary ? this.selectedVocabulary.vocabulary : undefined)
        .then((results: Concept[]) => {
          const resultsWithReferencedVocabularies = results.filter(concept => any(concept.vocabularies, cv => any(this.vocabularies, v => v.internalId === cv.internalId)));
          this.queryResults = limit(resultsWithReferencedVocabularies, limitQueryResults);
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

      this.searchResults = [
        new AddNewConcept(suggestText + ' ' + toVocabularyText, () => this.canAddNew()),
        ...filterAndSortSearchResults<Concept>(this.queryResults, this.searchText, this.contentExtractors, this.searchFilters, defaultLabelComparator(this.localizer))
      ];
    } else {
      this.searchResults = [];
    }
  }

  selectItem(item: Concept|AddNewConcept) {

    this.selectedItem = item;
    this.submitError = null;
    this.$scope.form.$setPristine();

    if (item instanceof AddNewConcept) {
      this.selection = new NewConceptData(lowerCase(this.searchText, this.localizer.language), this.resolveInitialVocabulary());
    } else {
      this.vocabularyService.getConcept(item.id).then(concept => this.selection = concept);
    }
  }

  loadingSelection(item: Concept|AddNew) {
    if (item instanceof AddNew || item !== this.selectedItem) {
      return false;
    } else {
      if (!this.selection) {
        return true;
      } else {
        const searchResult = <Concept> item;
        const selection = this.selection;
        return isConcept(selection) && !searchResult.id.equals(selection.id);
      }
    }
  }

  resolveInitialVocabulary() {
    return this.vocabularies[0];
  }

  canAddNew() {
    return this.allowSuggestions && !!this.searchText && this.vocabularies.length > 0;
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

      const conceptSuggestion = this.vocabularyService.createConceptSuggestion(selection.vocabulary.vocabulary, selection.label, selection.comment, extractId(selection.broaderConcept), language, this.model);

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
