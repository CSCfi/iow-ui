import { IScope, IPromise, ui } from 'angular';
import IModalService = ui.bootstrap.IModalService;
import IModalServiceInstance = ui.bootstrap.IModalServiceInstance;
import { ReferenceDataService } from '../../services/referenceDataService';
import { comparingBoolean, comparingLocalizable } from '../../utils/comparators';
import { Localizer, LanguageService } from '../../services/languageService';
import { AddNew } from '../common/searchResults';
import gettextCatalog = angular.gettext.gettextCatalog;
import { EditableForm } from '../form/editableEntityController';
import { Uri } from '../../entities/uri';
import { any, all } from '../../utils/array';
import * as _ from 'lodash';
import { Exclusion } from '../../utils/exclusion';
import { SearchController, SearchFilter, applyFilters } from '../filter/contract';
import { ifChanged } from '../../utils/angular';
import { ReferenceData, ReferenceDataServer, ReferenceDataGroup } from '../../entities/referenceData';
import { Model } from '../../entities/model';

const noExclude = (_referenceData: ReferenceData) => null;

export class SearchReferenceDataModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  private open(model: Model, referenceDatasFromModel: boolean, exclude: Exclusion<ReferenceData>): IPromise<ReferenceData> {
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

  openSelectionForModel(model: Model, exclude: Exclusion<ReferenceData> = noExclude): IPromise<ReferenceData> {
    return this.open(model, false, exclude);
  }

  openSelectionForProperty(model: Model, exclude: Exclusion<ReferenceData> = noExclude) {
    return this.open(model, true, exclude);
  }
}

export interface SearchReferenceDataScope extends IScope {
  form: EditableForm;
}

export class SearchReferenceDataModalController implements SearchController<ReferenceData> {

  searchResults: (ReferenceData|AddNewReferenceData)[];
  referenceDataServers: ReferenceDataServer[];
  referenceDatas: ReferenceData[];
  referenceDataGroups: ReferenceDataGroup[];
  showServer: ReferenceDataServer;
  showGroup: ReferenceDataGroup|null;
  searchText: string = '';
  loadingResults = true;
  selectedItem: ReferenceData|AddNewReferenceData;
  selection: ReferenceData|AddNewReferenceDataFormData;
  cannotConfirm: string|null;
  submitError: string|null = null;

  localizer: Localizer;

  contentMatchers = [
    { name: 'Label', extractor: (referenceData: ReferenceData) => referenceData.title },
    { name: 'Description', extractor: (referenceData: ReferenceData) => referenceData.description }
  ];

  contentExtractors = this.contentMatchers.map(m => m.extractor);

  private searchFilters: SearchFilter<ReferenceData>[] = [];

  /* @ngInject */
  constructor(private $scope: SearchReferenceDataScope,
              private $uibModalInstance: IModalServiceInstance,
              public model: Model,
              public referenceDatasFromModel: boolean,
              private referenceDataService: ReferenceDataService,
              languageService: LanguageService,
              private gettextCatalog: gettextCatalog,
              public exclude: Exclusion<ReferenceData>) {

    this.localizer = languageService.createLocalizer(model);

    const init = (referenceDatas: ReferenceData[]) => {
      this.referenceDatas = referenceDatas;

      this.referenceDataGroups = _.chain<ReferenceData>(this.referenceDatas)
        .map(referenceData => referenceData.groups)
        .flatten<ReferenceDataGroup>()
        .uniqBy(group => group.id.uri)
        .value()
        .sort(comparingLocalizable<ReferenceDataGroup>(this.localizer, group => group.title));

      if (this.showGroup && all(this.referenceDataGroups, group => !group.id.equals(this.showGroup!.id))) {
        this.showGroup = null;
      }

      this.referenceDatas.sort(
        comparingBoolean<ReferenceData>(referenceData => !!this.exclude(referenceData))
          .andThen(comparingLocalizable<ReferenceData>(this.localizer, referenceData => referenceData.title)));

      this.search();
      this.loadingResults = false;
    };


    if (referenceDatasFromModel) {
      init(model.referenceDatas);
    } else {

      const serversPromise = referenceDataService.getReferenceDataServers().then(servers => this.referenceDataServers = servers);

      $scope.$watch(() => this.showServer, server => {
        this.loadingResults = true;
        serversPromise
          .then(servers => referenceDataService.getReferenceDatasForServers(server ? [server] : servers))
          .then(init);
      });
    }

    this.addFilter(referenceData =>
      !this.showGroup || any(referenceData.groups, group => group.id.equals(this.showGroup!.id))
    );

    $scope.$watch(() => this.showGroup, ifChanged<ReferenceDataGroup|null>(() => this.search()));
  }

  addFilter(filter: SearchFilter<ReferenceData>) {
    this.searchFilters.push(filter);
  }

  get items() {
    return this.referenceDatas;
  }

  get showExcluded() {
    return !!this.searchText;
  }

  search() {
    if (this.referenceDatas) {

      const result: (ReferenceData|AddNewReferenceData)[] = [
        new AddNewReferenceData(`${this.gettextCatalog.getString('Create new reference data')} '${this.searchText}'`, this.canAddNew.bind(this))
      ];

      this.searchResults = result.concat(applyFilters(this.referenceDatas, this.searchFilters));
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
      this.referenceDataService.newReferenceData(selection.uri, selection.label, selection.description, this.localizer.language)
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
