import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import * as _ from 'lodash';
import { ConceptService } from '../../services/conceptService';
import { Language } from '../../services/languageService';
import { Uri } from '../../services/entities';


export class SearchSchemeModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(excludedSchemes: Set<Uri>, language: Language): IPromise<any> {
    return this.$uibModal.open({
      template: require('./searchSchemeModal.html'),
      size: 'medium',
      controller: SearchSchemeController,
      controllerAs: 'ctrl',
      backdrop: false,
      resolve: {
        excludedSchemes: () => excludedSchemes,
        language: () => language
      }
    }).result;
  }
}

class SearchSchemeController {

  searchResults: any[];
  schemes: any[];
  selectedScheme: any;
  searchText: string = '';

  /* @ngInject */
  constructor($scope: IScope,
              private $uibModalInstance: IModalServiceInstance,
              private excludedSchemes: Set<Uri>,
              private conceptService: ConceptService,
              private language: Language) {


    conceptService.getAllSchemes(language).then(result => {
      this.schemes = _.reject(result.data.vocabularies, (scheme: any) => excludedSchemes.has(scheme.id));
      this.search();
    });

    $scope.$watch(() => this.searchText, () => this.search());
  }

  search() {
    this.searchResults = _.chain(this.schemes)
      .filter(scheme => this.textFilter(scheme))
      .sortBy(scheme => scheme.title)
      .value();
  }

  selectScheme(scheme: any) {
    this.$uibModalInstance.close(scheme);
  }

  private textFilter(scheme: any): boolean {
    return !this.searchText || (scheme.title || '').toLowerCase().includes(this.searchText.toLowerCase());
  }

  close() {
    this.$uibModalInstance.dismiss();
  }
}
