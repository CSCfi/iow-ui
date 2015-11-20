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

class Bullet {
  constructor(public title: string, public content: string) {
  }
}

export class FrontPageController {

  bullets: Bullet[] = [
    new Bullet('What is description?', 'What is description content'),
    new Bullet('What is method?', 'What is method content'),
    new Bullet('What can I do?', 'What can I do content'),
    new Bullet('How?', 'How content')
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
