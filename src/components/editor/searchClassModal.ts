import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import * as _ from 'lodash';
import { SearchConceptModal, ConceptCreation } from './searchConceptModal';
import { Class, ClassListItem, Model, Uri, DefinedBy } from '../../services/entities';
import { ClassService } from '../../services/classService';
import { LanguageService } from '../../services/languageService';
import { containsAny, combineExclusions, createDefinedByExclusion } from '../../services/utils';

export enum SearchClassType {
  Class, Shape, All, SpecializedClass
}

export class SearchClassModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  private openModal(model: Model, searchClassType: SearchClassType, exclude: (klass: ClassListItem) => string, onlySelection: boolean) {
    return this.$uibModal.open({
      template: require('./searchClassModal.html'),
      size: 'large',
      controller: SearchClassController,
      controllerAs: 'ctrl',
      backdrop: false,
      resolve: {
        model: () => model,
        searchClassType: () => searchClassType,
        exclude: () => combineExclusions(exclude, createDefinedByExclusion(model)),
        onlySelection: () => onlySelection
      }
    }).result;
  }

  open(model: Model, searchClassType: SearchClassType, exclude: (klass: ClassListItem) => string): IPromise<ConceptCreation|Class> {
    return this.openModal(model, searchClassType, exclude, false);
  }

  openWithOnlySelection(model: Model, searchClassType: SearchClassType, exclude: (klass: ClassListItem) => string = (item: ClassListItem) => null): IPromise<Class> {
    return this.openModal(model, searchClassType, exclude, true);
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
              public exclude: (klass: ClassListItem) => string,
              public onlySelection: boolean,
              private searchConceptModal: SearchConceptModal) {

    const showShapes = containsAny([SearchClassType.All, SearchClassType.Shape, SearchClassType.SpecializedClass], [searchClassType]);
    const showClasses = containsAny([SearchClassType.All, SearchClassType.Class, SearchClassType.SpecializedClass], [searchClassType]);

    classService.getAllClasses().then((allClasses: ClassListItem[]) => {

      this.classes = _.chain(allClasses)
        .reject(klass => !showShapes && klass.isOfType('shape'))
        .reject(klass => !showClasses && klass.isOfType('class') || (searchClassType === SearchClassType.SpecializedClass && !klass.definedBy.isOfType('profile')))
        .value();

      this.models = _.chain(this.classes)
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
