import IScope = angular.IScope;
import ILogService = angular.ILogService;
import ILocationService = angular.ILocationService;
import _ = require('lodash');
import { LocationService } from '../services/locationService';
import { GroupService } from '../services/groupService';
import { SearchService } from '../services/searchService';
import { LanguageService } from '../services/languageService';
import { AdvancedSearchModal } from './advancedSearchModal';
import { GroupListItem, SearchResult } from '../services/entities';
import { MaintenanceModal } from './maintenance';
import { Url } from '../services/uri';
import { module as mod }  from './module';

const frontPageImage = require('../assets/iow_etusivu_kuva.svg');
const frontPageImageEn = require('../assets/iow_etusivu_kuva-en.svg');

mod.directive('frontPage', () => {
  return {
    restrict: 'E',
    scope: {},
    bindToController: true,
    template: require('./frontPage.html'),
    controllerAs: 'ctrl',
    controller: FrontPageController
  };
});

interface Bullet {
  title: string;
  content: string;
}

export class FrontPageController {

  bullets: Bullet[] = [
    { title: 'What is description?', content: 'What is description content' },
    { title: 'What is method?', content: 'What is method content' },
    { title: 'What can I do?', content: 'What can I do content' }
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
              private advancedSearchModal: AdvancedSearchModal,
              private maintenanceModal: MaintenanceModal) {

    locationService.atFrontPage();

    groupService.getAllGroups().then(groups => {
      this.groups = groups;
    }, error => maintenanceModal.open(error));

    $scope.$watch(() => this.searchText, text => this.search(text));
  }

  get frontPageImage() {
    switch (this.languageService.UILanguage) {
      case 'fi':
        return frontPageImage;
      case 'en':
        return frontPageImageEn;
      default:
        return frontPageImage;
    }
  }

  search(text: string) {
    if (text) {
      this.searchService.searchAnything(text, this.languageService.getModelLanguage())
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
    this.advancedSearchModal.open().then(searchResult => this.selectSearchResult(searchResult));
  }

  private go(withIowUrl: {iowUrl(href: boolean): Url}) {
    if (withIowUrl.iowUrl) {
      this.$location.url(withIowUrl.iowUrl(false));
    }
  }
}
