import IPromise = angular.IPromise;
import IScope = angular.IScope;
import * as _ from 'lodash';
import { LanguageService, Language } from '../../services/languageService';
import { ModelService } from '../../services/modelService';
import { Require, Uri } from '../../services/entities';
import { AddRequireModal } from './addRequireModal';


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

class SearchRequireController {

  searchResults: Require[];
  requires: Require[];
  selectedRequire: Require;
  searchText: string = '';

  /* @ngInject */
  constructor($scope: IScope,
              private $uibModalInstance: angular.ui.bootstrap.IModalServiceInstance,
              private excludedRequires: Set<Uri>,
              private language: Language,
              private modelService: ModelService,
              private languageService: LanguageService,
              private addRequireModal: AddRequireModal) {

    modelService.getAllRequires().then(result => {
      this.requires = _.reject(result, require => excludedRequires.has(require.id));
      this.search();
    });

    $scope.$watch(() => this.searchText, () => this.search());
  }

  search() {
    this.searchResults = _.chain(this.requires)
      .filter(require => this.textFilter(require))
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

  selectRequire(require: Require) {
    this.selectedRequire = require;
  }

  isSelected(require: Require): boolean {
    return require.id === (this.selectedRequire && this.selectedRequire.id);
  }

  confirm() {
    this.$uibModalInstance.close(this.selectedRequire);
  }

  createNew () {
    this.addRequireModal.open(this.language)
      .then(require =>this.$uibModalInstance.close(require));
  }

  close() {
    this.$uibModalInstance.dismiss();
  }
}
