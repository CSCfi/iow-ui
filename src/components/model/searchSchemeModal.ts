import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import * as _ from 'lodash';
import { ConceptService } from '../../services/conceptService';
import { Language } from '../../services/languageService';

const noExclude = (scheme: any) => <string> null;

export class SearchSchemeModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(language:Language, exclude: (scheme: any) => string = noExclude): angular.IPromise<any> {
    return this.$uibModal.open({
      template: require('./searchSchemeModal.html'),
      size: 'medium',
      controller: SearchSchemeController,
      controllerAs: 'ctrl',
      backdrop: true,
      resolve: {
        exclude: () => exclude,
        language: () => language
      }
    }).result;
  }
}

class SearchSchemeController {

  searchResults: any[];
  schemes: any[];
  searchText: string = '';
  showExcluded: boolean;

  /* @ngInject */
  constructor($scope: IScope,
              private $uibModalInstance: IModalServiceInstance,
              public exclude: (scheme: any) => string,
              private conceptService: ConceptService,
              private language: Language) {

    conceptService.getAllSchemes(language).then(result => {
      this.schemes = result.data.vocabularies;
      this.search();
    });

    $scope.$watch(() => this.searchText, () => this.search());
    $scope.$watch(() => this.showExcluded, () => this.search());
  }

  search() {
    this.searchResults = _.chain(this.schemes)
      .filter(scheme => this.textFilter(scheme))
      .filter(scheme => this.excludedFilter(scheme))
      .sortBy(scheme => scheme.title)
      .value();
  }

  selectItem(scheme: any) {
    if (!this.exclude(scheme)) {
      this.$uibModalInstance.close(scheme);
    }
  }

  private textFilter(scheme: any): boolean {
    return !this.searchText || (scheme.title || '').toLowerCase().includes(this.searchText.toLowerCase());
  }

  private excludedFilter(scheme: any): boolean {
    return this.showExcluded || !this.exclude(scheme);
  }

  close() {
    this.$uibModalInstance.dismiss();
  }
}
