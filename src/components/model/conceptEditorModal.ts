import IScope = angular.IScope;
import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IPromise = angular.IPromise;
import IQService = angular.IQService;
import gettextCatalog = angular.gettext.gettextCatalog;
import { ConceptService } from '../../services/conceptService';
import { LanguageService, Localizer } from '../../services/languageService';
import { Model, Concept, DefinedBy, ConceptSuggestion, Localizable, Reference } from '../../services/entities';
import { comparingLocalizable } from '../../services/comparators';
import { ConfirmationModal } from '../common/confirmationModal';
import { ConceptViewController } from './conceptView';
import { any } from '../../utils/array';

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
      backdrop: false,
      resolve: {
        model: () => model
      }
    }).result;
  }
};

export class ConceptEditorModalController {

  concepts: Concept[] = [];
  searchResults: Concept[] = [];
  selection: Concept;

  models: DefinedBy[] = [];
  references: Reference[] = [];
  showModel: DefinedBy;
  showReference: Reference;
  searchText: string = '';

  loadingResults: boolean;
  editInProgress = () => this.view.isEditing();

  view: ConceptViewController;
  localizer: Localizer;

  /* @ngInject */
  constructor(private $scope: IScope,
              private $uibModalInstance: IModalServiceInstance,
              languageService: LanguageService,
              private conceptService: ConceptService,
              private confirmationModal: ConfirmationModal,
              private model: Model) {

    this.localizer = languageService.createLocalizer(model);
    this.loadingResults = true;

    conceptService.getConceptsForModel(model)
      .then(concepts => {
        this.concepts = concepts;
        this.models = _.chain(concepts)
          .filter(concept => concept instanceof ConceptSuggestion && !!concept.definedBy)
          .map((concept: ConceptSuggestion) => concept.definedBy)
          .uniq(definedBy => definedBy.id.uri)
          .value();

        this.references = _.chain(concepts)
          .map(concept => concept.inScheme)
          .flatten()
          .filter(scheme => scheme instanceof Reference)
          .uniq(scheme => scheme.id)
          .value();

        this.sort();
        this.search();
        this.loadingResults = false;
      });

    $scope.$watch(() => this.localizer.language, lang => this.sort());
    $scope.$watch(() => this.searchText, () => this.search());
    $scope.$watch(() => this.showModel, () => this.search());
    $scope.$watch(() => this.showReference, () => this.search());

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
    const labelComparator = comparingLocalizable<{label: Localizable}>(this.localizer.language, definedBy => definedBy.label);
    this.concepts.sort(labelComparator);
    this.models.sort(labelComparator);
  }

  selectionEdited(concept: Concept) {
    for (let i = 0; i < this.concepts.length; i++) {
      if (this.concepts[i].id.equals(concept.id)) {
        Object.assign(this.concepts[i], concept);
        break;
      }
    }
  }

  registerView(view: ConceptViewController) {
    this.view = view;
  }

  search() {
    this.searchResults = this.concepts.filter(concept =>
      this.textFilter(concept) &&
      this.modelFilter(concept) &&
      this.referenceFilter(concept)
    );
  }

  private textFilter(concept: Concept): boolean {
    return !this.searchText || this.localizedLabelAsLower(concept).includes(this.searchText.toLowerCase());
  }

  private modelFilter(concept: Concept): boolean {
    return !this.showModel || concept instanceof ConceptSuggestion && concept.definedBy.id.equals(this.showModel.id);
  }

  private referenceFilter(concept: Concept): boolean {
    return !this.showReference || any(concept.getSchemes(), scheme => scheme.id.equals(this.showReference.id));
  }

  private localizedLabelAsLower(concept: Concept): string {
    return this.localizer.translate(concept.label).toLowerCase();
  }

  selectItem(item: Concept) {
    this.view.cancelEditing();
    this.selection = item;
  }

  close() {
    this.$uibModalInstance.close();
  }
}

