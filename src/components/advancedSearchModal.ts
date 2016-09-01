import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import * as _ from 'lodash';
import { SearchService } from '../services/searchService';
import { LanguageService, Localizer } from '../services/languageService';
import { SearchResult, Type, frontPageSearchLanguageContext, LanguageContext } from '../services/entities';
import { containsAny } from '../utils/array';


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
  private localizer: Localizer;

  /* @ngInject */
  constructor($scope: IScope,
              private $uibModalInstance: IModalServiceInstance,
              private searchService: SearchService,
              private languageService: LanguageService) {

    this.localizer = languageService.createLocalizer(frontPageSearchLanguageContext);

    $scope.$watch(() => this.searchText, text => {
      if (text) {
        this.searchService.searchAnything(text)
        .then(results => this.apiSearchResults = results)
        .then(() => this.search());
      }
    });

    $scope.$watch(() => this.searchTypes, () => this.search(), true);
  }

  get context(): LanguageContext {
    return this.localizer.context;
  }

  search() {
    this.searchResults = _.chain(this.apiSearchResults)
      .sortBy(result => this.localizer.translateLabelAsLower(result))
      .filter(result => this.typeFilter(result))
      .value();
  }

  selectSearchResult(searchResult: SearchResult) {
    if (searchResult.iowUrl) {
      this.$uibModalInstance.close(searchResult);
    }
  };

  private typeFilter(searchResult: SearchResult) {
    return containsAny(searchResult.type, this.searchTypes);
  }
}
