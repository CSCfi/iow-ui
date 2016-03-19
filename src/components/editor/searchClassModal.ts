import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import * as _ from 'lodash';
import { SearchConceptModal, EntityCreation } from './searchConceptModal';
import { Class, ClassListItem, Model, DefinedBy } from '../../services/entities';
import { ClassService } from '../../services/classService';
import { LanguageService } from '../../services/languageService';
import { comparingBoolean, comparingString } from '../../services/comparators';
import { AddNew } from '../common/searchResults';
import gettextCatalog = angular.gettext.gettextCatalog;
import { isDefined } from '../../services/utils';


export const noExclude = (item: ClassListItem) => <string> null;
export const defaultTextForSelection = (klass: Class) => 'Use class';

export class SearchClassModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  private openModal(model: Model, exclude: (klass: ClassListItem) => string, onlySelection: boolean, textForSelection: (klass: Class) => string) {
    return this.$uibModal.open({
      template: require('./searchClassModal.html'),
      size: 'large',
      controller: SearchClassController,
      controllerAs: 'ctrl',
      backdrop: true,
      resolve: {
        model: () => model,
        exclude: () => exclude,
        onlySelection: () => onlySelection,
        textForSelection: () => textForSelection,
      }
    }).result;
  }

  open(model: Model, exclude: (klass: ClassListItem) => string, textForSelection: (klass: Class) => string): IPromise<EntityCreation|Class> {
    return this.openModal(model, exclude, false, textForSelection);
  }

  openWithOnlySelection(model: Model, exclude: (klass: ClassListItem) => string, textForSelection: (klass: Class) => string = defaultTextForSelection): IPromise<Class> {
    return this.openModal(model, exclude, true, textForSelection);
  }
};

class SearchClassController {

  private classes: ClassListItem[];

  close = this.$uibModalInstance.dismiss;
  searchResults: (ClassListItem|AddNew)[] = [];
  selection: Class;
  searchText: string = '';
  showProfiles: boolean;
  showModel: DefinedBy;
  models: DefinedBy[] = [];
  cannotConfirm: string;
  loadingResults: boolean;
  selectedItem: ClassListItem|AddNew;

  /* @ngInject */
  constructor($scope: IScope,
              private $uibModalInstance: IModalServiceInstance,
              private classService: ClassService,
              private languageService: LanguageService,
              public model: Model,
              public exclude: (klass: ClassListItem) => string,
              public onlySelection: boolean,
              private textForSelection: (klass: Class) => string,
              private searchConceptModal: SearchConceptModal,
              private gettextCatalog: gettextCatalog) {

    this.showProfiles = onlySelection;
    this.loadingResults = true;

    classService.getAllClasses().then((allClasses: ClassListItem[]) => {

      this.classes = allClasses;
      this.models = _.chain(this.classes)
        .map(klass => klass.definedBy)
        .uniq(definedBy => definedBy.id.uri)
        .sort(languageService.labelComparison)
        .value();

      this.search();
    });

    $scope.$watch(() => this.searchText, () => this.search());
    $scope.$watch(() => this.showModel, () => this.search());
    $scope.$watch(() => this.showProfiles, () => this.search());
  }

  get showExcluded() {
    return !!this.searchText;
  }

  search() {
    if (this.classes) {

      const result: (ClassListItem|AddNew)[] = [new AddNew(`${this.gettextCatalog.getString('Create new class')} '${this.searchText}'`, this.canAddNew.bind(this))];

      const classSearchResult = this.classes.filter(klass =>
        this.textFilter(klass) &&
        this.modelFilter(klass) &&
        this.excludedFilter(klass) &&
        this.showProfilesFilter(klass)
      );

      classSearchResult.sort(
        comparingBoolean((item: ClassListItem) => !!this.exclude(item))
          .andThen(comparingString(this.localizedLabelAsLower.bind(this))));

      this.searchResults = result.concat(classSearchResult);
    }

    this.loadingResults = !isDefined(this.classes);
  }

  canAddNew() {
    return !this.onlySelection && !!this.searchText;
  }

  selectItem(item: ClassListItem|AddNew) {
    this.selectedItem = item;
    if (item instanceof AddNew) {
      this.createNewClass();
    } else if (item instanceof ClassListItem) {
      this.cannotConfirm = this.exclude(item);
      this.classService.getClass(item.id, this.model).then(result => this.selection = result);
    }
  }

  loadingSelection(item: ClassListItem|AddNew) {
    if (item instanceof ClassListItem) {
      return item === this.selectedItem && (!this.selection || !item.id.equals(this.selection.id));
    } else {
      return false;
    }
  }

  confirm() {
    this.$uibModalInstance.close(this.selection);
  }

  createNewClass() {
    return this.searchConceptModal.openNewEntityCreation(this.model.references, 'class', this.searchText)
      .then(conceptCreation => this.$uibModalInstance.close(conceptCreation));
  }

  private localizedLabelAsLower(klass: ClassListItem): string {
    return this.languageService.translate(klass.label).toLowerCase();
  }

  private textFilter(klass: ClassListItem): boolean {
    return !this.searchText || this.localizedLabelAsLower(klass).includes(this.searchText.toLowerCase());
  }

  private modelFilter(klass: ClassListItem): boolean {
    return !this.showModel || klass.definedBy.id.equals(this.showModel.id);
  }

  private excludedFilter(klass: ClassListItem): boolean {
    return this.showExcluded || !this.exclude(klass);
  }

  private showProfilesFilter(klass: ClassListItem): boolean {
    return this.showProfiles || !klass.definedBy.isOfType('profile');
  }
}
