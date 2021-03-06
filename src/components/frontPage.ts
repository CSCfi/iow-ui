import { IScope, ILocationService, IAttributes } from 'angular';
import { LocationService } from '../services/locationService';
import { GroupService } from '../services/groupService';
import { SearchService } from '../services/searchService';
import { LanguageService, Localizer } from '../services/languageService';
import { AdvancedSearchModal } from './advancedSearchModal';
import { MaintenanceModal } from './maintenance';
import { Url } from '../entities/uri';
import { module as mod }  from './module';
import { SearchController, SearchFilter } from './filter/contract';
import { frontPageSearchLanguageContext, LanguageContext } from '../entities/contract';
import { SearchResult } from '../entities/search';
import { GroupListItem } from '../entities/group';
import { ApplicationController } from './application';
import { HelpProvider } from './common/helpProvider';
import { FrontPageHelpService } from '../help/frontPageHelp';
import { filterAndSortSearchResults, defaultLabelComparator } from './filter/util';
import { modalCancelHandler } from '../utils/angular';

const frontPageImage = require('../assets/iow_etusivu_kuva.svg');
const frontPageImageEn = require('../assets/iow_etusivu_kuva-en.svg');

mod.directive('frontPage', () => {
  return {
    restrict: 'E',
    scope: {},
    bindToController: true,
    template: require('./frontPage.html'),
    controllerAs: 'ctrl',
    controller: FrontPageController,
    require: ['frontPage', '^application'],
    link(_$scope: IScope, _element: JQuery, _attributes: IAttributes, [ctrl, applicationController]: [FrontPageController, ApplicationController]) {
      applicationController.registerHelpProvider(ctrl);
    }
  };
});

interface Bullet {
  title: string;
  content: string;
}

export class FrontPageController implements SearchController<SearchResult>, HelpProvider {

  bullets: Bullet[] = [
    { title: 'What is description?', content: 'What is description content' },
    { title: 'What is method?', content: 'What is method content' },
    { title: 'What can I do?', content: 'What can I do content' }
  ];

  groups: GroupListItem[];
  searchText: string = '';
  searchResults: SearchResult[] = [];
  apiSearchResults: SearchResult[] = [];
  private localizer: Localizer;

  contentExtractors = [ (searchResult: SearchResult) => searchResult.label, (searchResult: SearchResult) => searchResult.comment ];
  private searchFilters: SearchFilter<SearchResult>[] = [];

  helps = this.frontPageHelpService.getHelps();

  /* @ngInject */
  constructor($scope: IScope,
              private $location: ILocationService,
              locationService: LocationService,
              groupService: GroupService,
              private searchService: SearchService,
              private languageService: LanguageService,
              private advancedSearchModal: AdvancedSearchModal,
              private frontPageHelpService: FrontPageHelpService,
              maintenanceModal: MaintenanceModal) {

    this.localizer = languageService.createLocalizer(frontPageSearchLanguageContext);
    locationService.atFrontPage();

    groupService.getAllGroups().then(groups => {
      this.groups = groups;
    }, error => maintenanceModal.open(error));


    $scope.$watch(() => this.searchText, text => {
      if (text) {
        this.searchService.searchAnything(text)
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

  search() {
    this.searchResults = filterAndSortSearchResults<SearchResult>(this.apiSearchResults, this.searchText, this.contentExtractors, this.searchFilters, defaultLabelComparator(this.localizer));
  }

  selectSearchResult(searchResult: SearchResult) {
    this.go(searchResult);
  }

  selectGroup(group: GroupListItem) {
    this.go(group);
  }

  openAdvancedSearch() {
    this.advancedSearchModal.open()
      .then(searchResult => this.selectSearchResult(searchResult), modalCancelHandler);
  }

  private go(withIowUrl: {iowUrl(): Url|null}) {

    const url = withIowUrl.iowUrl();

    if (url) {
      this.$location.url(url);
    }
  }
}
