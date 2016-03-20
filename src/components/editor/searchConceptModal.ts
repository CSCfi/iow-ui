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
import { comparingString, comparingBoolean } from '../../services/comparators';
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

interface NewConceptData {
  label: string;
  comment?: string;
  broaderConcept?: Concept;
}

interface FormData {
  entity?: NewEntityData;
  concept?: NewConceptData;
}

class ConceptCreation {
  constructor(public reference: Reference) {
  }
}

function createNewEntityData(label?: string): FormData {
  return {
    entity: {
      label
    }
  };
}

function createNewConceptData(label?: string): FormData {
  return {
    entity: {
      label
    },
    concept: {
      label
    }
  };
}

export function isEntityCreation(obj: any): obj is EntityCreation {
  return obj.concept;
}

function isConcept(obj: Concept|ConceptCreation): obj is Concept {
  return obj instanceof FintoConcept || obj instanceof ConceptSuggestion;
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

class SearchConceptController {

  close = this.$uibModalInstance.dismiss;
  queryResults: ConceptSearchResult[];
  searchResults: (ConceptSearchResult|AddNewConcept)[];
  selection: Concept|ConceptCreation;
  defineConceptTitle: string;
  buttonTitle: string;
  labelTitle: string;
  selectedReference: Reference;
  searchText: string = '';
  submitError: string;
  isConcept = isConcept;
  editInProgress = () => this.$scope.form.$dirty;
  loadingResults: boolean;
  selectedItem: ConceptSearchResult|AddNewConcept;

  formData: FormData = { entity: { label: ''}, concept: { label: ''}};

  /* @ngInject */
  constructor(private $scope: SearchPredicateScope,
              private $uibModalInstance: IModalServiceInstance,
              private $q: IQService,
              private languageService: LanguageService,
              public type: Type,
              initialSearch: string,
              public newEntityCreation: boolean,
              public references: Reference[],
              private conceptService: ConceptService,
              private gettextCatalog: gettextCatalog,
              private searchConceptModal: SearchConceptModal) {

    this.defineConceptTitle = `Define concept for the ${this.newEntityCreation ? 'new ' : ''}${this.type}`;
    this.buttonTitle = (newEntityCreation ? 'Create new ' + type : 'Use');
    this.labelTitle = `${_.capitalize(this.type)} label`;
    this.searchText = initialSearch;
    this.loadingResults = true;

    $scope.$watch(() => this.searchText, text => this.query(text).then(() => this.search()));
    $scope.$watch(() => this.selectedReference, () => this.query(this.searchText).then(() => this.search()));
    $scope.$watch(() => this.formData.concept && this.formData.concept.label, label => {
      if (label) {
        this.formData.entity.label = label;
      }
    });
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

      const result: (ConceptSearchResult|AddNewConcept)[] = _.map(this.activeReferences, reference => {
          const suggestText = `${this.gettextCatalog.getString('suggest')} '${this.searchText}'`;
          const toVocabularyText = `${this.gettextCatalog.getString('to vocabulary')} ${this.languageService.translate(reference.label)}`;
          return new AddNewConcept(suggestText + ' ' + toVocabularyText, () => this.canAddNew(reference), reference);
        });

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
      this.selection = new ConceptCreation(item.reference);
      this.formData = createNewConceptData(this.searchText);
    } else {
      const conceptSearchResult: ConceptSearchResult = <ConceptSearchResult> item;
      const conceptPromise: IPromise<FintoConcept|ConceptSuggestion> = conceptSearchResult.suggestion
        ? this.conceptService.getConceptSuggestion(conceptSearchResult.id)
        : this.conceptService.getFintoConcept(conceptSearchResult.id);

      conceptPromise.then(concept => {
        this.selection = concept;
        this.formData = createNewEntityData(this.languageService.translate(concept.label));
      });
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
    this.searchConceptModal.openSelection(this.activeReferences, this.type)
      .then(concept => this.formData.concept.broaderConcept = concept);
  }

  canAddNew(reference: Reference) {
    if (!this.searchText) {
      return false;
    }

    for (const concept of this.queryResults) {
      const exactMatch = this.localizedLabelAsLower(concept) === this.searchText.toLowerCase();
      if (exactMatch && concept.reference.id.equals(reference.id)) {
        return false;
      }
    }

    return true;
  }

  confirm() {
    this.$uibModalInstance.close(this.resolveResult());
  }

  private resolveResult(): IPromise<Concept|EntityCreation> {

    function extractId(entity: {id: Uri}) {
      return entity && entity.id;
    }

    const selection = this.selection;
    const language = this.languageService.modelLanguage;

    if (selection instanceof ConceptCreation) {
      const conceptData = this.formData.concept;
      const conceptSuggestion = this.conceptService.createConceptSuggestion(selection.reference.id, conceptData.label, conceptData.comment, extractId(conceptData.broaderConcept), language)
        .then(conceptId => this.conceptService.getConceptSuggestion(conceptId));

      if (this.newEntityCreation) {
        return conceptSuggestion.then(cs => new EntityCreation(cs, this.formData.entity));
      } else {
        return conceptSuggestion;
      }
    } else if (isConcept(selection)) {
      if (this.newEntityCreation) {
        return this.$q.when(new EntityCreation(selection, this.formData.entity));
      } else {
        return this.$q.when(selection);
      }
    } else {
      throw new Error('Unsupported selection ' + selection);
    }
  }
}

class AddNewConcept extends AddNew {
  constructor(public label: string, public show: () => boolean, public reference: Reference) {
    super(label, show);
  }
}
