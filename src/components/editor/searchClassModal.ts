import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IPromise = angular.IPromise;
import IQService = angular.IQService;
import IScope = angular.IScope;
import * as _ from 'lodash';
import { SearchConceptModal, EntityCreation } from './searchConceptModal';
import { Class, ClassListItem, Model, DefinedBy, NamespaceType } from '../../services/entities';
import { ClassService } from '../../services/classService';
import { LanguageService } from '../../services/languageService';
import { comparingBoolean, comparingString, comparingLocalizable } from '../../services/comparators';
import { AddNew } from '../common/searchResults';
import gettextCatalog = angular.gettext.gettextCatalog;
import { isDefined, glyphIconClassForType } from '../../services/utils';
import { Uri } from '../../services/uri';
import { EditableForm } from '../form/editableEntityController';


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
        textForSelection: () => textForSelection
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

interface FormData {
  externalUri: Uri;
}

function createFormData(): FormData {
  return {
    externalUri: null
  };
}

function isFormData(item: Class|FormData): item is FormData {
  return item && !(item instanceof Class);
}

export interface SearchClassScope extends IScope {
  form: EditableForm;
}

class SearchClassController {

  private classes: ClassListItem[];

  close = this.$uibModalInstance.dismiss;
  searchResults: (ClassListItem|AddNewClass)[] = [];
  selection: Class|FormData;
  searchText: string = '';
  showProfiles: boolean;
  showModel: DefinedBy;
  models: DefinedBy[] = [];
  cannotConfirm: string;
  loadingResults: boolean;
  selectedItem: ClassListItem|AddNewClass;
  submitError: string;

  /* @ngInject */
  constructor(private $scope: SearchClassScope,
              private $uibModalInstance: IModalServiceInstance,
              private $q: IQService,
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

    const classPromises: IPromise<ClassListItem[]>[] = [];
    classPromises.push(classService.getAllClasses());

    if (model.isOfType('profile')) {
      classPromises.push(classService.getExternalClassesForModel(model));
    }

    $q.all(classPromises)
      .then((classesLists: ClassListItem[][]) => {

        this.classes = _.flatten(classesLists);
        this.models = _.chain(this.classes)
          .map(klass => klass.definedBy)
          .uniq(definedBy => definedBy.id.uri)
          .sort(comparingLocalizable<ClassListItem>(languageService.modelLanguage, klass => klass.label))
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

  isSelectionFormData(): boolean {
    return isFormData(this.selection);
  }

  search() {
    if (this.classes) {

      const result: (ClassListItem|AddNewClass)[] = [
        new AddNewClass(`${this.gettextCatalog.getString('Create new class')} '${this.searchText}'`, this.canAddNew.bind(this), false),
        new AddNewClass(`${this.gettextCatalog.getString('Create new shape')} ${this.gettextCatalog.getString('by referencing external uri')}`, () => this.canAddNew() && this.model.isOfType('profile'), true)
      ];

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

  selectItem(item: ClassListItem|AddNewClass) {
    this.selectedItem = item;
    this.selection = null;
    this.submitError = null;
    this.$scope.form.editing = false;
    this.$scope.form.$setPristine();

    if (item instanceof AddNewClass) {
      if (item.external) {
        this.$scope.form.editing = true;
        this.selection = createFormData();
      } else {
        this.createNewClass();
      }
    } else if (item instanceof ClassListItem) {
      this.cannotConfirm = this.exclude(item);

      if (this.model.isNamespaceKnownAndOfType(item.definedBy.id.namespace, [NamespaceType.EXTERNAL, NamespaceType.TECHNICAL])) {
        this.classService.getExternalClass(item.id, this.model).then(result => this.selection = result);
      } else {
        this.classService.getClass(item.id, this.model).then(result => this.selection = result);
      }
    }
  }

  loadingSelection(item: ClassListItem|AddNewClass) {
    const selection = this.selection;
    if (item instanceof ClassListItem) {
      return item === this.selectedItem && (!selection || (selection instanceof Class && !item.id.equals(selection.id)));
    } else {
      return false;
    }
  }

  confirm() {
    const selection = this.selection;

    if (selection instanceof Class) {
      this.$uibModalInstance.close(this.selection);
    } else if (isFormData(selection)) {
      this.classService.getExternalClass(selection.externalUri, this.model)
        .then(klass => {
          if (klass) {
            this.$uibModalInstance.close(klass);
          } else {
            this.submitError = 'External class not found';
          }
        }, err => this.submitError = err.data.errorMessage);
    } else {
      throw new Error('Unsupported selection: ' + selection);
    }
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

class AddNewClass extends AddNew {
  constructor(public label: string, public show: () => boolean, public external: boolean) {
    super(label, show, glyphIconClassForType(['class']));
  }
}
