import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import * as _ from 'lodash';
import { SearchConceptModal, ConceptCreation } from './searchConceptModal'
import { Class, ClassListItem, Concept, Model, Reference, Uri } from '../../services/entities';
import { ClassService } from '../../services/classService';
import { LanguageService } from '../../services/languageService';
import { ModelListItem } from '../../services/entities';
import { DefinedBy } from '../../services/entities';

export enum SearchClassType {
  Class, Shape, Both
}

export class SearchClassModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  private openModal(model: Model, searchClassType: SearchClassType, excludedClasses: Set<Uri>, onlySelection: boolean) {
    return this.$uibModal.open({
      template: require('./searchClassModal.html'),
      size: 'large',
      controller: SearchClassController,
      controllerAs: 'ctrl',
      backdrop: false,
      resolve: {
        model: () => model,
        searchClassType: () => searchClassType,
        excludedClasses: () => excludedClasses,
        onlySelection: () => onlySelection
      }
    }).result;
  }

  open(model: Model, searchClassType: SearchClassType, excludedClasses: Set<Uri>): IPromise<ConceptCreation|Class> {
    return this.openModal(model, searchClassType, excludedClasses, false);
  }

  openWithOnlySelection(model: Model, searchClassType: SearchClassType, excludedClasses: Set<Uri> = new Set<Uri>()): IPromise<Class> {
    return this.openModal(model, searchClassType, excludedClasses, true);
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
              private searchClassType: SearchClassType,
              public excludedClasses: Set<Uri>,
              public onlySelection: boolean,
              private searchConceptModal: SearchConceptModal) {

    const showShapes = searchClassType === SearchClassType.Both || searchClassType === SearchClassType.Shape;
    const showClasses = searchClassType === SearchClassType.Both || searchClassType === SearchClassType.Class;

    classService.getAllClasses().then((allClasses: ClassListItem[]) => {
      this.classes = _.filter(allClasses, klass => (showShapes || klass.type !== 'shape') && (showClasses || klass.type !== 'class'));
      this.models = _.chain(this.classes)
        .filter(klass => this.requireFilter(klass))
        .map(klass => klass.definedBy)
        .uniq(definedBy => definedBy.id)
        .value();

      this.search();
    });

    $scope.$watch(() => this.searchText, () => this.search());
    $scope.$watch(() => this.modelId, () => this.search());
    $scope.$watch(() => this.showExcluded, () => this.search());
  }

  search() {
    this.searchResults = _.chain(this.classes)
      .filter(klass => this.requireFilter(klass))
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

  private requireFilter(klass: ClassListItem): boolean {
    let modelIds = _.chain(this.model.requires).map(require => require.id).concat(this.model.id).value();
    return _.any(modelIds, id => id === klass.definedBy.id);
  }

  private excludedFilter(klass: ClassListItem): boolean {
    return this.showExcluded || !this.excludedClasses.has(klass.id);
  }
}
