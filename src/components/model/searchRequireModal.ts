import IPromise = angular.IPromise;
import IScope = angular.IScope;
import * as _ from 'lodash';
import { LanguageService, Language } from '../../services/languageService';
import { ModelService } from '../../services/modelService';
import { Require, Uri } from '../../services/entities';
import { AddRequireModal } from './addRequireModal';
import gettextCatalog = angular.gettext.gettextCatalog;

export class SearchRequireModal {
  /* @ngInject */
  constructor(private $uibModal: angular.ui.bootstrap.IModalService) {
  }

  open(excludedRequires: Set<Uri>, language: Language): IPromise<Require> {
    return this.$uibModal.open({
      template: require('./searchRequireModal.html'),
      size: 'medium',
      controller: SearchRequireController,
      controllerAs: 'ctrl',
      backdrop: false,
      resolve: {
        excludedRequires: () => excludedRequires,
        language: () => language
      }
    }).result;
  }
}

class SearchResult {
  constructor(public require: Require, public disabled: boolean) {}
}

class SearchRequireController {

  searchResults: SearchResult[];
  requires: Require[];
  searchText: string = '';

  /* @ngInject */
  constructor($scope: IScope,
              private $uibModalInstance: angular.ui.bootstrap.IModalServiceInstance,
              private excludedRequires: Set<Uri>,
              private language: Language,
              private modelService: ModelService,
              private languageService: LanguageService,
              private addRequireModal: AddRequireModal,
              private gettextCatalog: gettextCatalog) {

    modelService.getAllRequires().then(result => {
      this.requires = result;
      this.search();
    });

    $scope.$watch(() => this.searchText, () => this.search());
  }

  search() {
    this.searchResults = _.chain(this.requires)
      .filter(require => this.textFilter(require))
      .sortBy(require => require.namespace)
      .map(require => new SearchResult(require, this.excludedRequires.has(require.id)))
      .value();
  }

  textFilter(require: Require) {
    const search = this.searchText.toLowerCase();

    function contains(text: string): boolean {
      return (text || '').toLowerCase().includes(search);
    }

    return !this.searchText || contains(this.languageService.translate(require.label)) || contains(require.namespace);
  }

  selectSearchResult(searchResult: SearchResult) {
    if (!searchResult.disabled) {
      this.$uibModalInstance.close(searchResult.require);
    }
  }

  searchResultTitle(searchResult: SearchResult) {
    if (searchResult.disabled) {
      return this.gettextCatalog.getString('Already added');
    }
  }

  createNew() {
    this.addRequireModal.open(this.language)
      .then(require =>this.$uibModalInstance.close(require));
  }

  close() {
    this.$uibModalInstance.dismiss();
  }
}
