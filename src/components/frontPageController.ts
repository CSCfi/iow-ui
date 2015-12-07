import _ = require('lodash');
import IScope = angular.IScope;
import ILogService = angular.ILogService;
import ILocationService = angular.ILocationService;
import { LocationService } from '../services/locationService';
import { GroupService } from '../services/groupService';
import { SearchService } from '../services/searchService';
import { LanguageService } from '../services/languageService';
import { AdvancedSearchModal } from './advancedSearchModal';
import { GroupListItem, SearchResult, Url } from '../services/entities';

interface Bullet {
  title: string;
  content: string;
}

export class FrontPageController {

  bullets: Bullet[] = [
    { title: 'What is description?', content: 'What is description content' },
    { title: 'What is method?', content: 'What is method content' },
    { title: 'What can I do?', content: 'What can I do content' },
    { title: 'How?', content: 'How content' }
  ];

  groups: GroupListItem[];
  searchText: string = '';
  searchResults: SearchResult[] = [];

  /* @ngInject */
  constructor(private $scope: IScope,
              private $log: ILogService,
              private $location: ILocationService,
              private locationService: LocationService,
              private groupService: GroupService,
              private searchService: SearchService,
              private languageService: LanguageService,
              private advancedSearchModal: AdvancedSearchModal) {

    locationService.atFrontPage();

    groupService.getAllGroups().then(groups => {
      this.groups = groups;
    }, error => $log.error(error));

    $scope.$watch(() => this.searchText, text => this.search(text));
  }

  search(text: string) {
    if (text) {
      this.searchService.searchAnything(text, this.languageService.modelLanguage)
        .then(results => {
          this.searchResults = results;
        });
    } else {
      this.searchResults = [];
    }
  }

  selectSearchResult(searchResult: SearchResult) {
    this.go(searchResult);
  }

  selectGroup(group: GroupListItem) {
    this.go(group);
  }

  openAdvancedSearch() {
    this.advancedSearchModal.open().then(this.selectSearchResult);
  }

  private go(withIowUrl: {iowUrl(): Url}) {
    if (withIowUrl.iowUrl) {
      this.$location.url(withIowUrl.iowUrl());
    }
  }
}
