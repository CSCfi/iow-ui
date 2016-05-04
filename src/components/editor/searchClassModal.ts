import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IPromise = angular.IPromise;
import IQService = angular.IQService;
import IScope = angular.IScope;
import * as _ from 'lodash';
import { SearchConceptModal, EntityCreation } from './searchConceptModal';
import {
  Class, ClassListItem, Model, DefinedBy, NamespaceType, AbstractClass, ExternalEntity
} from '../../services/entities';
import { ClassService } from '../../services/classService';
import { LanguageService } from '../../services/languageService';
import { comparingBoolean, comparingString, comparingLocalizable } from '../../services/comparators';
import { AddNew } from '../common/searchResults';
import gettextCatalog = angular.gettext.gettextCatalog;
import { glyphIconClassForType, collectIds } from '../../services/utils';
import { EditableForm } from '../form/editableEntityController';

export const noExclude = (item: AbstractClass) => <string> null;
export const defaultTextForSelection = (klass: Class) => 'Use class';

export class SearchClassModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  private openModal(model: Model, exclude: (klass: AbstractClass) => string, onlySelection: boolean, textForSelection: (klass: Class) => string) {
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

  open(model: Model, exclude: (klass: AbstractClass) => string, textForSelection: (klass: Class) => string): IPromise<ExternalEntity|EntityCreation|Class> {
    return this.openModal(model, exclude, false, textForSelection);
  }

  openWithOnlySelection(model: Model, exclude: (klass: AbstractClass) => string, textForSelection: (klass: Class) => string = defaultTextForSelection): IPromise<Class> {
    return this.openModal(model, exclude, true, textForSelection);
  }
};

export interface SearchClassScope extends IScope {
  form: EditableForm;
}

class SearchClassController {

  private classes: ClassListItem[] = [];
  private currentModelClassIds: Set<string> = new Set<string>();

  close = this.$uibModalInstance.dismiss;
  searchResults: (ClassListItem|AddNewClass)[] = [];
  selection: Class|ExternalEntity;
  searchText: string = '';
  showProfiles: boolean;
  showModel: DefinedBy|Model;
  models: (DefinedBy|Model)[] = [];
  cannotConfirm: string;
  loadingResults: boolean;
  selectedItem: ClassListItem|AddNewClass;
  submitError: string;

  /* @ngInject */
  constructor(private $scope: SearchClassScope,
              private $uibModalInstance: IModalServiceInstance,
              private classService: ClassService,
              private languageService: LanguageService,
              public model: Model,
              public exclude: (klass: AbstractClass) => string,
              public onlySelection: boolean,
              private textForSelection: (klass: Class) => string,
              private searchConceptModal: SearchConceptModal,
              private gettextCatalog: gettextCatalog) {

    this.showProfiles = onlySelection;
    this.loadingResults = true;

    if (onlySelection) {
      this.showModel = model;
    }

    const appendResults = (classes: ClassListItem[]) => {
      this.classes = this.classes.concat(classes);

      this.models = [this.model];
      this.models = this.models.concat(_.chain(this.classes)
        .map(klass => klass.definedBy)
        .uniq(definedBy => definedBy.id.uri)
        .sort(comparingLocalizable<ClassListItem>(languageService.getModelLanguage(this.model), klass => klass.label))
        .value());

      this.search();

      this.loadingResults = false;
    };

    classService.getAllClasses().then(appendResults);
    classService.getClassesForModel(model.id).then(classes => this.currentModelClassIds = collectIds(classes));

    if (model.isOfType('profile')) {
      classService.getExternalClassesForModel(model).then(appendResults);
    }

    classService.getClassesForModel(model.id);

    $scope.$watch(() => this.searchText, () => this.search());
    $scope.$watch(() => this.showModel, () => this.search());
    $scope.$watch(() => this.showProfiles, () => this.search());
  }

  isThisModel(item: DefinedBy|Model) {
    return this.model === item;
  }

  get showExcluded() {
    return !!this.searchText;
  }

  isSelectionFormData(): boolean {
    return this.selection instanceof ExternalEntity;
  }

  search() {
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

  canAddNew() {
    return !this.onlySelection && !!this.searchText;
  }

  selectItem(item: ClassListItem|AddNewClass) {
    this.selectedItem = item;
    this.submitError = null;
    this.$scope.form.editing = false;
    this.$scope.form.$setPristine();

    if (item instanceof AddNewClass) {
      if (item.external) {
        this.$scope.form.editing = true;
        this.selection = new ExternalEntity('class');
      } else {
        this.createNewClass();
      }
    } else if (item instanceof ClassListItem) {
      this.cannotConfirm = this.exclude(item);

      if (this.model.isNamespaceKnownToBeNotModel(item.definedBy.id.url)) {
        this.classService.getExternalClass(item.id, this.model).then(result => this.selection = result);
      } else {
        this.classService.getClass(item.id, this.model).then(result => this.selection = result);
      }
    } else {
      throw new Error('Unsupported item: ' + item);
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
    } else if (selection instanceof ExternalEntity) {
      this.classService.newClassFromExternal(selection.id, this.model)
        .then(klass => {
          if (klass) {
            if (this.exclude(klass)) {
              this.submitError = this.exclude(klass);
            } else {
              this.$uibModalInstance.close(selection);
            }
          }
        }, err => this.submitError = err.data.errorMessage);
    } else {
      throw new Error('Unsupported selection: ' + selection);
    }
  }

  createNewClass() {
    return this.searchConceptModal.openNewEntityCreation(this.model.references, this.model, 'class', this.searchText)
      .then(conceptCreation => this.$uibModalInstance.close(conceptCreation));
  }

  private localizedLabelAsLower(klass: ClassListItem): string {
    return this.languageService.translate(klass.label, this.model).toLowerCase();
  }

  private textFilter(klass: ClassListItem): boolean {
    return !this.searchText || this.localizedLabelAsLower(klass).includes(this.searchText.toLowerCase());
  }

  private modelFilter(klass: ClassListItem): boolean {
    if (!this.showModel) {
      return true;
    } else if (this.showModel === this.model) {
      return this.currentModelClassIds.has(klass.id.uri);
    } else {
      return klass.definedBy.id.equals(this.showModel.id);
    }
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
