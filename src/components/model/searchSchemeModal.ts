import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import { ConceptService } from '../../services/conceptService';
import { comparingBoolean, comparingString } from '../../services/comparators';
import { isDefined } from '../../services/utils';
import { Language } from '../contracts';

const noExclude = (scheme: any) => <string> null;

export class SearchSchemeModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(language: Language, exclude: (scheme: any) => string = noExclude): angular.IPromise<any> {
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
  loadingResults: boolean;

  /* @ngInject */
  constructor($scope: IScope,
              private $uibModalInstance: IModalServiceInstance,
              public exclude: (scheme: any) => string,
              private conceptService: ConceptService,
              private language: Language) {

    this.loadingResults = true;

    conceptService.getAllSchemes(language).then(result => {
      this.schemes = result.data.vocabularies;
      this.search();
    });

    $scope.$watch(() => this.searchText, () => this.search());
    $scope.$watch(() => this.showExcluded, () => this.search());
  }

  get showExcluded() {
    return !!this.searchText;
  }

  search() {
    if (this.schemes) {
      this.searchResults = this.schemes.filter(scheme =>
        this.textFilter(scheme) &&
        this.excludedFilter(scheme)
      );

      this.searchResults.sort(
        comparingBoolean((scheme: any) => !!this.exclude(scheme))
          .andThen(comparingString((scheme: any) => scheme.title)));
    }

    this.loadingResults = !isDefined(this.schemes);
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
