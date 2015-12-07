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


export class SearchClassModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  private openModal(model: Model, excludedClasses: Set<Uri>, onlySelection: boolean) {
    return this.$uibModal.open({
      template: require('./searchClassModal.html'),
      size: 'large',
      controller: SearchClassController,
      controllerAs: 'ctrl',
      backdrop: false,
      resolve: {
        model: () => model,
        excludedClasses: () => excludedClasses,
        onlySelection: () => onlySelection
      }
    }).result;
  }

  open(model: Model, excludedClassMap: Set<Uri>): IPromise<ConceptCreation|Class> {
    return this.openModal(model, excludedClassMap, false);
  }

  openWithOnlySelection(model: Model): IPromise<Class> {
    return this.openModal(model, new Set<Uri>(), true);
  }
};

export class SearchClassController {

  private classes: ClassListItem[];

  close = this.$uibModalInstance.dismiss;
  searchResults: ClassListItem[];
  selectedClass: Class;
  selectedItem: ClassListItem;
  searchText: string = '';
  modelId: Uri;
  models: ModelListItem[] = [];

  /* @ngInject */
  constructor($scope: IScope,
              private $uibModalInstance: IModalServiceInstance,
              private classService: ClassService,
              private languageService: LanguageService,
              private model: Model,
              private excludedClasses: Set<Uri>,
              public onlySelection: boolean,
              private searchConceptModal: SearchConceptModal) {

    classService.getAllClasses().then((allClasses: ClassListItem[]) => {
      this.classes = _.reject(allClasses, klass => excludedClasses.has(klass.id));
      this.models = _.chain(this.classes)
        .filter(klass => this.requireFilter(klass))
        .map(klass => klass.model)
        .uniq(classModel => classModel.id)
        .value();

      this.search();
    });

    $scope.$watch(() => this.searchText, () => this.search());
    $scope.$watch(() => this.modelId, () => this.search());
  }

  search() {
    this.searchResults = _.chain(this.classes)
      .filter(klass => this.requireFilter(klass))
      .filter(klass => this.textFilter(klass))
      .filter(klass => this.modelFilter(klass))
      .sortBy(klass => this.localizedLabelAsLower(klass))
      .value();
  }

  selectClass(klass: ClassListItem) {
    this.selectedItem = klass;
    this.classService.getClass(klass.id).then(result => this.selectedClass = result);
  }

  isSelected(klass: ClassListItem) {
    return klass === this.selectedItem;
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
    return !this.modelId || klass.model.id === this.modelId;
  }

  private requireFilter(klass: ClassListItem): boolean {
    let modelIds = _.chain(this.model.requires).map(require => require.id).concat(this.model.id).value();
    return _.any(modelIds, id => id === klass.model.id);
  }
}
