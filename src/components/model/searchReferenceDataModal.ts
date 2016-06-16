import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import { ModelService } from '../../services/modelService';
import { ReferenceData, Model, ReferenceDataGroup, ReferenceDataServer } from '../../services/entities';
import { comparingBoolean, comparingLocalizable } from '../../services/comparators';
import { Localizer, LanguageService } from '../../services/languageService';
import { AddNew } from '../common/searchResults';
import gettextCatalog = angular.gettext.gettextCatalog;
import { EditableForm } from '../form/editableEntityController';
import { Uri } from '../../services/uri';
import { any, all } from '../../utils/array';

const noExclude = (referenceData: ReferenceData) => <string> null;

export class SearchReferenceDataModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  private open(model: Model, referenceDatasFromModel: boolean, exclude: (referenceData: ReferenceData) => string = noExclude): IPromise<ReferenceData> {
    return this.$uibModal.open({
      template: require('./searchReferenceDataModal.html'),
      size: 'large',
      controller: SearchReferenceDataModalController,
      controllerAs: 'ctrl',
      backdrop: true,
      resolve: {
        model: () => model,
        referenceDatasFromModel: () => referenceDatasFromModel,
        exclude: () => exclude
      }
    }).result;
  }

  openSelectionForModel(model: Model, exclude: (referenceData: ReferenceData) => string = noExclude): IPromise<ReferenceData> {
    return this.open(model, false, exclude);
  }

  openSelectionForProperty(model: Model, exclude: (referenceData: ReferenceData) => string = noExclude) {
    return this.open(model, true, exclude);
  }
}

export interface SearchReferenceDataScope extends IScope {
  form: EditableForm;
}

export class SearchReferenceDataModalController {

  searchResults: (ReferenceData|AddNewReferenceData)[];
  referenceDataServers: ReferenceDataServer[];
  referenceDatas: ReferenceData[];
  referenceDataGroups: ReferenceDataGroup[];
  showServer: ReferenceDataServer;
  showGroup: ReferenceDataGroup;
  searchText: string = '';
  loadingResults = true;
  selectedItem: ReferenceData|AddNewReferenceData;
  selection: ReferenceData|AddNewReferenceDataFormData;
  cannotConfirm: string;
  submitError: string;

  localizer: Localizer;

  /* @ngInject */
  constructor(private $scope: SearchReferenceDataScope,
              private $uibModalInstance: IModalServiceInstance,
              public model: Model,
              public referenceDatasFromModel: boolean,
              private modelService: ModelService,
              languageService: LanguageService,
              private gettextCatalog: gettextCatalog,
              public exclude: (referenceData: ReferenceData) => string) {

    this.localizer = languageService.createLocalizer(model);

    const init = (referenceDatas: ReferenceData[]) => {
      this.referenceDatas = referenceDatas;
      this.referenceDataGroups = _.chain(this.referenceDatas)
        .map(referenceData => referenceData.groups)
        .flatten<ReferenceDataGroup>()
        .uniq(group => group.id.uri)
        .sort(comparingLocalizable<ReferenceDataGroup>(this.localizer.language, group => group.title))
        .value();

      if (this.showGroup && all(this.referenceDataGroups, group => !group.id.equals(this.showGroup.id))) {
        this.showGroup = null;
      }

      this.search();
      this.loadingResults = false;
    };


    if (referenceDatasFromModel) {
      init(model.referenceDatas);
    } else {

      const serversPromise = modelService.getReferenceDataServers().then(servers => this.referenceDataServers = servers);

      $scope.$watch(() => this.showServer, server => {
        this.loadingResults = true;
        serversPromise
          .then(servers => modelService.getReferenceDatasForServers(server ? [server] : servers))
          .then(init);
      });
    }

    $scope.$watch(() => this.searchText, () => this.search());
    $scope.$watch(() => this.showExcluded, () => this.search());
    $scope.$watch(() => this.showGroup, () => this.search());
  }

  get showExcluded() {
    return !!this.searchText;
  }

  search() {
    if (this.referenceDatas) {

      const result: (ReferenceData|AddNewReferenceData)[] = [
        new AddNewReferenceData(`${this.gettextCatalog.getString('Create new reference data')} '${this.searchText}'`, this.canAddNew.bind(this))
      ];

      const referenceDataSearchResults = this.referenceDatas.filter(referenceData =>
        this.textFilter(referenceData) &&
        this.excludedFilter(referenceData) &&
        this.groupFilter(referenceData)
      );

      referenceDataSearchResults.sort(
        comparingBoolean((referenceData: ReferenceData) => !!this.exclude(referenceData))
          .andThen(comparingLocalizable(this.localizer.language, (referenceData: ReferenceData) => referenceData.title)));

      this.searchResults = result.concat(referenceDataSearchResults);
    }
  }

  selectItem(item: ReferenceData|AddNewReferenceData) {
    this.selectedItem = item;
    this.submitError = null;
    this.$scope.form.editing = false;
    this.$scope.form.$setPristine();

    if (item instanceof AddNewReferenceData) {
      this.$scope.form.editing = true;
      this.selection = new AddNewReferenceDataFormData();

    } else if (item instanceof ReferenceData) {

      this.cannotConfirm = this.exclude(item);

      if (!this.cannotConfirm) {
        this.selection = item;
      }
    } else {
      throw new Error('Unsupported item: ' + item);
    }
  }

  confirm() {
    const selection = this.selection;

    if (selection instanceof AddNewReferenceDataFormData) {
      this.modelService.newReferenceData(selection.uri, selection.label, selection.description, this.localizer.language)
        .then(referenceData => this.$uibModalInstance.close(referenceData), err => this.submitError = err.data.errorMessage);
    } else {
      this.$uibModalInstance.close((<ReferenceData> selection));
    }
  }

  loadingSelection(item: ReferenceData|AddNewReferenceDataFormData) {
    const selection = this.selection;
    if (item instanceof ReferenceData) {
      return item === this.selectedItem && (!selection || (!this.isSelectionFormData() && !item.id.equals((<ReferenceData> selection).id)));
    } else {
      return false;
    }
  }

  isSelectionFormData(): boolean {
    return this.selection instanceof AddNewReferenceDataFormData;
  }

  canAddNew() {
    return !!this.searchText && !this.referenceDatasFromModel;
  }

  private textFilter(referenceData: ReferenceData): boolean {
    return !this.searchText || this.localizer.translate(referenceData.title).toLowerCase().includes(this.searchText.toLowerCase());
  }

  private excludedFilter(referenceData: ReferenceData): boolean {
    return this.showExcluded || !this.exclude(referenceData);
  }

  private groupFilter(referenceData: ReferenceData): boolean {
    return !this.showGroup || any(referenceData.groups, group => group.id.equals(this.showGroup.id));
  }

  close() {
    this.$uibModalInstance.dismiss();
  }
}

class AddNewReferenceDataFormData {
  uri: Uri;
  label: string;
  description: string;
}

class AddNewReferenceData extends AddNew {
  constructor(public label: string, public show: () => boolean) {
    super(label, show);
  }
}
