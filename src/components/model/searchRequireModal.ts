import IPromise = angular.IPromise;
import IScope = angular.IScope;
import * as _ from 'lodash';
import { LanguageService, Language } from '../../services/languageService';
import { ModelService } from '../../services/modelService';
import { Require } from '../../services/entities';
import { AddRequireModal } from './addRequireModal';

export class SearchRequireModal {
  /* @ngInject */
  constructor(private $uibModal: angular.ui.bootstrap.IModalService) {
  }

  open(exclude: (require: Require) => string, language: Language): IPromise<Require> {
    return this.$uibModal.open({
      template: require('./searchRequireModal.html'),
      size: 'medium',
      controller: SearchRequireController,
      controllerAs: 'ctrl',
      backdrop: true,
      resolve: {
        exclude: () => exclude,
        language: () => language
      }
    }).result;
  }
}

class SearchRequireController {

  searchResults: Require[];
  requires: Require[];
  searchText: string = '';
  showExcluded: boolean;

  /* @ngInject */
  constructor($scope: IScope,
              private $uibModalInstance: angular.ui.bootstrap.IModalServiceInstance,
              public  exclude: (require: Require) => string,
              private language: Language,
              private modelService: ModelService,
              private languageService: LanguageService,
              private addRequireModal: AddRequireModal) {

    modelService.getAllRequires().then(result => {
      this.requires = result;
      this.search();
    });

    $scope.$watch(() => this.searchText, () => this.search());
    $scope.$watch(() => this.showExcluded, () => this.search());
  }

  search() {
    this.searchResults = _.chain(this.requires)
      .filter(require => this.textFilter(require))
      .filter(require => this.excludedFilter(require))
      .sortBy(require => require.namespace)
      .value();
  }

  textFilter(require: Require) {
    const search = this.searchText.toLowerCase();

    function contains(text: string): boolean {
      return (text || '').toLowerCase().includes(search);
    }

    return !this.searchText || contains(this.languageService.translate(require.label)) || contains(require.namespace);
  }

  private excludedFilter(require: Require): boolean {
    return this.showExcluded || !this.exclude(require);
  }

  selectItem(require: Require) {
    this.$uibModalInstance.close(require);
  }

  createNew() {
    this.addRequireModal.open(this.language)
      .then(require =>this.$uibModalInstance.close(require));
  }

  close() {
    this.$uibModalInstance.dismiss();
  }
}
