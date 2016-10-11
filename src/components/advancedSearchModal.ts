import { IPromise, IScope, ui } from 'angular';
import IModalService = ui.bootstrap.IModalService;
import IModalServiceInstance = ui.bootstrap.IModalServiceInstance;
import { SearchService } from '../services/searchService';
import { LanguageService, Localizer } from '../services/languageService';
import { comparingLocalizable } from '../services/comparators';
import { SearchController, SearchFilter, applyFilters } from './filter/contract';
import { Type } from '../entities/type';
import { frontPageSearchLanguageContext, LanguageContext } from '../entities/contract';
import { SearchResult } from '../entities/search';

export class AdvancedSearchModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(): IPromise<SearchResult> {
    return this.$uibModal.open({
      template: require('./advancedSearchModal.html'),
      size: 'medium',
      controller: AdvancedSearchController,
      controllerAs: 'ctrl'
    }).result;
  }
}

class AdvancedSearchController implements SearchController<SearchResult> {

  private apiSearchResults: SearchResult[] = [];

  close = this.$uibModalInstance.dismiss;
  searchResults: SearchResult[];
  types: Type[] = ['model', 'class', 'shape', 'attribute', 'association'];
  searchText: string = '';
  private localizer: Localizer;

  contentExtractors = [ (searchResult: SearchResult) => searchResult.label, (searchResult: SearchResult) => searchResult.comment ];
  private searchFilters: SearchFilter<SearchResult>[] = [];

  /* @ngInject */
  constructor($scope: IScope,
              private $uibModalInstance: IModalServiceInstance,
              private searchService: SearchService,
              languageService: LanguageService) {

    this.localizer = languageService.createLocalizer(frontPageSearchLanguageContext);

    $scope.$watch(() => this.searchText, text => {
      if (text) {
        this.searchService.searchAnything(text)
          .then(results => results.sort(comparingLocalizable<SearchResult>(this.localizer, result => result.label)))
          .then(results => this.apiSearchResults = results)
          .then(() => this.search());
      } else {
        this.apiSearchResults = [];
        this.search();
      }
    });
  }

  addFilter(filter: SearchFilter<SearchResult>) {
    this.searchFilters.push(filter);
  }

  get items() {
    return this.apiSearchResults;
  }

  get context(): LanguageContext {
    return this.localizer.context;
  }

  search() {
    this.searchResults = applyFilters(this.apiSearchResults, this.searchFilters);
  }

  selectSearchResult(searchResult: SearchResult) {
    if (searchResult.iowUrl) {
      this.$uibModalInstance.close(searchResult);
    }
  };
}
