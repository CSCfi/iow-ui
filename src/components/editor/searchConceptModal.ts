import Dataset = Twitter.Typeahead.Dataset;
import Templates = Twitter.Typeahead.Templates;
import IScope = angular.IScope;
import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IPromise = angular.IPromise;
import IQService = angular.IQService;
import * as _ from 'lodash';
import gettextCatalog = angular.gettext.gettextCatalog;
import { ConceptService, ConceptSearchResult } from '../../services/conceptService';
import { LanguageService } from '../../services/languageService';
import { Reference, ConceptSuggestion, Type, FintoConcept } from '../../services/entities';
import { comparingString, comparingBoolean, comparingLocalizable } from '../../services/comparators';
import { EditableForm } from '../form/editableEntityController';
import { AddNew } from '../common/searchResults';
import { Uri } from '../../services/uri';
import { isDefined } from '../../services/utils';

const limit = 1000;

type Concept = FintoConcept|ConceptSuggestion;

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

  constructor(public label: string, public reference: Reference) {
  }
}

export class SearchConceptModal {

  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  private open(references: Reference[], type: Type, newEntityCreation: boolean, initialSearch: string) {
    return this.$uibModal.open({
      template: require('./searchConceptModal.html'),
      size: 'large',
      controller: SearchConceptController,
      controllerAs: 'ctrl',
      backdrop: true,
      resolve: {
        references: () => references,
        type: () => type,
        newEntityCreation: () => newEntityCreation,
        initialSearch: () => initialSearch
      }
    }).result;
  }

  openSelection(references: Reference[], type: Type): IPromise<Concept> {
    return this.open(references, type, false, '');
  }

  openNewEntityCreation(references: Reference[], type: Type, initialSearch: string): IPromise<EntityCreation> {
    return this.open(references, type, true, initialSearch);
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
  selectedReference: Reference;
  searchText: string = '';
  submitError: string;
  editInProgress = () => this.$scope.form.$dirty;
  loadingResults: boolean;
  selectedItem: ConceptSearchResult|AddNewConcept;
  references: Reference[];
  selectableReferences: Reference[];

  /* @ngInject */
  constructor(private $scope: SearchPredicateScope,
              private $uibModalInstance: IModalServiceInstance,
              private $q: IQService,
              private languageService: LanguageService,
              public type: Type,
              initialSearch: string,
              public newEntityCreation: boolean,
              references: Reference[],
              private conceptService: ConceptService,
              private gettextCatalog: gettextCatalog,
              private searchConceptModal: SearchConceptModal) {

    this.defineConceptTitle = `Define concept for the ${this.newEntityCreation ? 'new ' : ''}${this.type}`;
    this.buttonTitle = (newEntityCreation ? 'Create new ' + type : 'Use');
    this.labelTitle = `${_.capitalize(this.type)} label`;
    this.searchText = initialSearch;
    this.references = references.slice();
    this.references.sort(this.referenceComparator);
    this.loadingResults = true;

    $scope.$watch(() => this.searchText, text => this.query(text).then(() => this.search()));
    $scope.$watch(() => this.selectedReference, () => this.query(this.searchText).then(() => this.search()));
    $scope.$watch(() => this.queryResults, results => {
      if (results) {
        this.selectableReferences = _.filter(references, reference => {
          for (const concept of results) {
            const exactMatch = this.localizedLabelAsLower(concept) === this.searchText.toLowerCase();
            if (exactMatch && concept.reference.id.equals(reference.id)) {
              return false;
            }
          }
          return true;
        });

        this.selectableReferences.sort(this.referenceComparator);
      }
    });
  }

  get referenceComparator() {
    return comparingBoolean<Reference>(reference => !reference.isLocal())
      .andThen(comparingLocalizable<Reference>(this.languageService.UILanguage, reference => reference.label));
  }

  isSelectionConcept() {
    return isConcept(this.selection);
  }

  isSelectionNewConceptData() {
    return isNewConceptData(this.selection);
  }

  get activeReferences() {
    return this.selectedReference ? [this.selectedReference] : this.references;
  }

  query(searchText: string): IPromise<any> {
    this.loadingResults = true;
    const language = this.languageService.modelLanguage;

    if (searchText && searchText.length >= 3) {
      return this.$q.all(_.flatten(_.map(this.activeReferences, reference => this.conceptService.searchConcepts(reference, language, searchText))))
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
        this.showReferenceFilter(concept)
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
    return this.languageService.translate(concept.label).toLowerCase();
  }

  private showReferenceFilter(concept: ConceptSearchResult) {
    return !!_.find(this.activeReferences, reference => concept.reference.id.equals(reference.id));
  }

  selectItem(item: ConceptSearchResult|AddNewConcept) {

    this.selectedItem = item;
    this.submitError = null;
    this.$scope.form.$setPristine();

    if (item instanceof AddNewConcept) {
      this.selection = new NewConceptData(this.searchText, this.resolveInitialReference());
    } else {
      const conceptSearchResult: ConceptSearchResult = <ConceptSearchResult> item;
      const conceptPromise: IPromise<FintoConcept|ConceptSuggestion> = conceptSearchResult.suggestion
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
      this.searchConceptModal.openSelection(this.activeReferences, this.type)
        .then(concept => selection.broaderConcept = concept);
    } else {
      throw new Error('Selection must be new concept data: ' + selection);
    }
  }

  resolveInitialReference() {
    for (const reference of this.selectableReferences) {
      if (reference.isLocal()) {
        return reference;
      }
    }

    return this.selectableReferences[0];
  }

  canAddNew() {
    return !!this.searchText && this.selectableReferences.length > 0;
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
    const language = this.languageService.modelLanguage;

    if (isNewConceptData(selection)) {

      const conceptSuggestion = this.conceptService.createConceptSuggestion(selection.reference.id, selection.label, selection.comment, extractId(selection.broaderConcept), language)
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
