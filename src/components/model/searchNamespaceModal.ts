import { IPromise, IScope, ui } from 'angular';
import IModalService = ui.bootstrap.IModalService;
import IModalServiceInstance = ui.bootstrap.IModalServiceInstance;
import { LanguageService } from '../../services/languageService';
import { ModelService } from '../../services/modelService';
import { AddEditNamespaceModal } from './addEditNamespaceModal';
import { comparingBoolean, comparingString } from '../../utils/comparators';
import { Language } from '../../utils/language';
import { Exclusion } from '../../utils/exclusion';
import { SearchController, SearchFilter, TextAnalysis } from '../filter/contract';
import { ifChanged, modalCancelHandler } from '../../utils/angular';
import { ImportedNamespace, Model } from '../../entities/model';
import { filterAndSortSearchResults } from '../filter/util';

const noExclude = (_ns: ImportedNamespace) => null;

export class SearchNamespaceModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(model: Model, language: Language, exclude: Exclusion<ImportedNamespace> = noExclude): IPromise<ImportedNamespace> {
    return this.$uibModal.open({
      template: require('./searchNamespaceModal.html'),
      size: 'medium',
      controller: SearchNamespaceController,
      controllerAs: 'ctrl',
      backdrop: true,
      resolve: {
        model: () => model,
        exclude: () => exclude,
        language: () => language
      }
    }).result;
  }
}

class SearchNamespaceController implements SearchController<ImportedNamespace> {

  searchResults: ImportedNamespace[];
  namespaces: ImportedNamespace[];
  searchText: string = '';
  showTechnical: boolean;
  loadingResults: boolean;

  contentExtractors = [ (ns: ImportedNamespace) => ns.namespace, (ns: ImportedNamespace) => ns.label ];
  private searchFilters: SearchFilter<ImportedNamespace>[] = [];

  /* @ngInject */
  constructor($scope: IScope,
              private $uibModalInstance: IModalServiceInstance,
              public exclude: Exclusion<ImportedNamespace>,
              private model: Model,
              private language: Language,
              modelService: ModelService,
              private languageService: LanguageService,
              private addEditNamespaceModal: AddEditNamespaceModal) {

    this.loadingResults = true;

    modelService.getAllImportableNamespaces().then(result => {
      this.namespaces = result;
      this.search();
      this.loadingResults = false;
    });

    this.addFilter(ns =>
      this.showTechnical || !!this.searchText || !ns.item.technical
    );

    $scope.$watch(() => this.showTechnical, ifChanged(() => this.search()));
  }

  addFilter(filter: SearchFilter<ImportedNamespace>) {
    this.searchFilters.push(filter);
  }

  get items() {
    return this.namespaces;
  }


  search() {
    const comparator = comparingBoolean<TextAnalysis<ImportedNamespace>>(item => !!this.exclude(item.item))
      .andThen(comparingString<TextAnalysis<ImportedNamespace>>(item => item.item.namespace));

    this.searchResults = filterAndSortSearchResults(this.namespaces, this.searchText, this.contentExtractors, this.searchFilters, comparator);
  }

  textFilter(ns: ImportedNamespace) {
    const search = this.searchText.toLowerCase();

    function contains(text: string): boolean {
      return (text || '').toLowerCase().includes(search);
    }

    return !this.searchText || contains(this.languageService.translate(ns.label, this.model)) || contains(ns.namespace);
  }

  selectItem(ns: ImportedNamespace) {
    if (!this.exclude(ns)) {
      this.$uibModalInstance.close(ns);
    }
  }

  createNew() {
    this.addEditNamespaceModal.openAdd(this.model, this.language)
      .then(ns => this.$uibModalInstance.close(ns), modalCancelHandler);
  }

  close() {
    this.$uibModalInstance.dismiss();
  }
}
