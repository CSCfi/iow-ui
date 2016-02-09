import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import * as _ from 'lodash';
import { SearchConceptModal, ConceptCreation } from './searchConceptModal';
import { Class, ClassListItem, Model, Uri, DefinedBy } from '../../services/entities';
import { ClassService } from '../../services/classService';
import { LanguageService } from '../../services/languageService';

const noExclude = (item: ClassListItem) => <string> null;

export class SearchClassModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  private openModal(model: Model, exclude: (klass: ClassListItem) => string, onlySelection: boolean) {
    return this.$uibModal.open({
      template: require('./searchClassModal.html'),
      size: 'large',
      controller: SearchClassController,
      controllerAs: 'ctrl',
      backdrop: true,
      resolve: {
        model: () => model,
        exclude: () => exclude,
        onlySelection: () => onlySelection
      }
    }).result;
  }

  open(model: Model, exclude: (klass: ClassListItem) => string = noExclude): IPromise<ConceptCreation|Class> {
    return this.openModal(model, exclude, false);
  }

  openWithOnlySelection(model: Model, exclude: (klass: ClassListItem) => string = noExclude): IPromise<Class> {
    return this.openModal(model, exclude, true);
  }
};

class SearchClassController {

  private classes: ClassListItem[];

  close = this.$uibModalInstance.dismiss;
  searchResults: ClassListItem[];
  selectedClass: Class;
  searchText: string = '';
  showExcluded: boolean;
  modelId: Uri;
  models: DefinedBy[] = [];

  /* @ngInject */
  constructor($scope: IScope,
              private $uibModalInstance: IModalServiceInstance,
              private classService: ClassService,
              private languageService: LanguageService,
              private model: Model,
              public exclude: (klass: ClassListItem) => string,
              public onlySelection: boolean,
              private searchConceptModal: SearchConceptModal) {

    classService.getAllClasses().then((allClasses: ClassListItem[]) => {

      this.classes = allClasses;
      this.models = _.chain(this.classes)
        .map(klass => klass.definedBy)
        .uniq(definedBy => definedBy.id)
        .sort(languageService.labelComparison)
        .value();

      this.search();
    });

    $scope.$watch(() => this.searchText, () => this.search());
    $scope.$watch(() => this.modelId, () => this.search());
    $scope.$watch(() => this.showExcluded, () => this.search());
  }

  search() {
    this.searchResults = _.chain(this.classes)
      .filter(klass => this.textFilter(klass))
      .filter(klass => this.modelFilter(klass))
      .filter(klass => this.excludedFilter(klass))
      .sortBy(klass => this.localizedLabelAsLower(klass))
      .value();
  }

  selectItem(klass: ClassListItem) {
    this.classService.getClass(klass.id).then(result => this.selectedClass = result);
  }

  confirm() {
    this.$uibModalInstance.close(this.selectedClass);
  }

  createNewClass() {
    return this.searchConceptModal.openNewCreation(this.model.references, 'class')
      .then(conceptCreation => this.$uibModalInstance.close(conceptCreation));
  }

  private localizedLabelAsLower(klass: ClassListItem): string {
    return this.languageService.translate(klass.label).toLowerCase();
  }

  private textFilter(klass: ClassListItem): boolean {
    return !this.searchText || this.localizedLabelAsLower(klass).includes(this.searchText.toLowerCase());
  }

  private modelFilter(klass: ClassListItem): boolean {
    return !this.modelId || klass.definedBy.id === this.modelId;
  }

  private excludedFilter(klass: ClassListItem): boolean {
    return this.showExcluded || !this.exclude(klass);
  }
}
