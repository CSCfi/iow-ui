import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import * as _ from 'lodash';
import { SearchService } from '../services/searchService';
import { LanguageService } from '../services/languageService';
import { SearchResult, Type } from '../services/entities';
import IQService = angular.IQService;
import { containsAny } from '../services/utils';


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
};

class AdvancedSearchController {

  private apiSearchResults: SearchResult[] = [];

  close = this.$uibModalInstance.dismiss;
  searchResults: SearchResult[];
  types: Type[] = ['model', 'class', 'shape', 'attribute', 'association'];
  searchText: string = '';
  searchTypes: Type[] = _.clone(this.types);

  /* @ngInject */
  constructor($scope: IScope,
              private $uibModalInstance: IModalServiceInstance,
              private searchService: SearchService,
              private languageService: LanguageService) {

    $scope.$watch(() => this.searchText, text => {
      if (text) {
        this.searchService.searchAnything(text, this.languageService.modelLanguage)
        .then(results => this.apiSearchResults = results)
        .then(() => this.search());
      }
    });

    $scope.$watch(() => this.searchTypes, () => this.search(), true);
  }

  search() {
    this.searchResults = _.chain(this.apiSearchResults)
      .sortBy(result => this.localizedLabelAsLower(result))
      .filter(result => this.typeFilter(result))
      .value();
  }

  selectSearchResult(searchResult: SearchResult) {
    if (searchResult.iowUrl) {
      this.$uibModalInstance.close(searchResult);
    }
  };

  private localizedLabelAsLower(searchResult: SearchResult) {
    return this.languageService.translate(searchResult.label).toLowerCase();
  }

  private typeFilter(searchResult: SearchResult) {
    return containsAny(searchResult.type, this.searchTypes);
  }
}
