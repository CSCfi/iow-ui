import IPromise = angular.IPromise;
import IScope = angular.IScope;
import * as _ from 'lodash';
import { LanguageService, Language } from '../../services/languageService';
import { ModelService } from '../../services/modelService';
import { Require, Model } from '../../services/entities';
import { AddRequireModal } from './addRequireModal';
import { comparingBoolean, comparingString } from '../../services/comparators';
import { isDefined } from '../../services/utils';

const noExclude = (require: Require) => <string> null;

export class SearchRequireModal {
  /* @ngInject */
  constructor(private $uibModal: angular.ui.bootstrap.IModalService) {
  }

  open(model: Model, language: Language, exclude: (require: Require) => string = noExclude): angular.IPromise<Require> {
    return this.$uibModal.open({
      template: require('./searchRequireModal.html'),
      size: 'medium',
      controller: SearchRequireController,
      controllerAs: 'ctrl',
      backdrop: true,
      resolve: {
        model: () => model,
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
  loadingResults: boolean;

  /* @ngInject */
  constructor($scope: IScope,
              private $uibModalInstance: angular.ui.bootstrap.IModalServiceInstance,
              public  exclude: (require: Require) => string,
              private model: Model,
              private language: Language,
              private modelService: ModelService,
              private languageService: LanguageService,
              private addRequireModal: AddRequireModal) {

    this.loadingResults = true;

    modelService.getAllRequires().then(result => {
      this.requires = result;
      this.search();
    });

    $scope.$watch(() => this.searchText, () => this.search());
    $scope.$watch(() => this.showExcluded, () => this.search());
  }

  get showExcluded() {
    return !!this.searchText;
  }

  search() {
    if (this.requires) {
      this.searchResults = this.requires.filter(require =>
        this.textFilter(require) &&
        this.excludedFilter(require)
      );

      this.searchResults.sort(
        comparingBoolean((item: Require) => !!this.exclude(item))
          .andThen(comparingString((item: Require) => item.namespace)));

      this.searchResults = _.chain(this.requires)
        .filter(require => this.textFilter(require))
        .filter(require => this.excludedFilter(require))
        .sortBy(require => require.namespace)
        .value();

      this.loadingResults = !isDefined(this.requires);
    }
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
    if (!this.exclude(require)) {
      this.$uibModalInstance.close(require);
    }
  }

  createNew() {
    this.addRequireModal.open(this.model, this.language)
      .then(require =>this.$uibModalInstance.close(require));
  }

  close() {
    this.$uibModalInstance.dismiss();
  }
}
