import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import * as _ from 'lodash';
import { SearchService } from '../services/searchService';
import { LanguageService } from '../services/languageService';
import { SearchResult, Type } from '../services/entities';


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
  types: Type[] = ['model', 'class', 'attribute', 'association'];
  searchText: string = '';
  searchTypes: Type[] = _.clone(this.types);

  /* @ngInject */
  constructor($scope: IScope,
              private $uibModalInstance: IModalServiceInstance,
              private searchService: SearchService,
              private languageService: LanguageService) {

    $scope.$watch(() => this.searchText, text => this.search(text));
  }

  search(text: string) {
    if (text) {
      this.searchService.searchAnything(text, this.languageService.modelLanguage)
        .then(searchResults => this.apiSearchResults = searchResults);
    } else {
      this.apiSearchResults = [];
    }
  }

  selectSearchResult(searchResult: SearchResult) {
    if (searchResult.iowUrl) {
      this.$uibModalInstance.close(searchResult);
    }
  };

  searchResults(): SearchResult[] {
    return _.chain(this.apiSearchResults)
      .sortBy(result => this.localizedLabelAsLower(result))
      .filter(result => this.typeFilter(result))
      .value();
  }

  private localizedLabelAsLower(searchResult: SearchResult) {
    return this.languageService.translate(searchResult.label).toLowerCase();
  }

  private typeFilter(searchResult: SearchResult) {
    return this.searchTypes.indexOf(searchResult.type) !== -1;
  }
}
