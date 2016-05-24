import IScope = angular.IScope;
import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IPromise = angular.IPromise;
import IQService = angular.IQService;
import gettextCatalog = angular.gettext.gettextCatalog;
import { ConceptService } from '../../services/conceptService';
import { LanguageService } from '../../services/languageService';
import { Model, Concept, DefinedBy, ConceptSuggestion } from '../../services/entities';
import { comparingLocalizable } from '../../services/comparators';
import { ConfirmationModal } from '../common/confirmationModal';
import { ConceptViewController } from './conceptView';

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
  showModel: DefinedBy;
  searchText: string = '';

  loadingResults: boolean;
  editInProgress = () => this.view.isEditing();

  view: ConceptViewController;

  /* @ngInject */
  constructor(private $scope: IScope,
              private $uibModalInstance: IModalServiceInstance,
              private languageService: LanguageService,
              private conceptService: ConceptService,
              private confirmationModal: ConfirmationModal,
              private model: Model) {

    this.loadingResults = true;

    conceptService.getConceptsForModel(model)
      .then(concepts => {
        this.concepts = concepts;

        this.models = _.chain(concepts)
          .filter(concept => concept instanceof ConceptSuggestion)
          .map((concept: ConceptSuggestion) => concept.definedBy)
          .uniq(definedBy => definedBy.id.uri)
          .sort(comparingLocalizable<DefinedBy>(languageService.getModelLanguage(this.model), definedBy => definedBy.label))
          .value();

        this.loadingResults = false;
        this.search();
      });

    $scope.$watch(() => this.searchText, () => this.search());
    $scope.$watch(() => this.showModel, () => this.search());
  }

  registerView(view: ConceptViewController) {
    this.view = view;
  }

  search() {
    this.searchResults = this.concepts.filter(concept =>
      this.textFilter(concept) &&
      this.modelFilter(concept)
    );
  }

  private textFilter(concept: Concept): boolean {
    return !this.searchText || this.localizedLabelAsLower(concept).includes(this.searchText.toLowerCase());
  }

  private modelFilter(concept: Concept): boolean {
    return !this.showModel || concept instanceof ConceptSuggestion && concept.definedBy.id.equals(this.showModel.id);
  }

  private localizedLabelAsLower(concept: Concept): string {
    return this.languageService.translate(concept.label, this.model).toLowerCase();
  }

  selectItem(item: Concept) {
    this.view.cancelEditing();
    this.selection = item;
  }

  close() {
    if (this.editInProgress()) {
      this.confirmationModal.openEditInProgress().then(() => this.$uibModalInstance.close());
    } else {
      this.$uibModalInstance.close();
    }
  }
}
