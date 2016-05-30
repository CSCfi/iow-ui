import IPromise = angular.IPromise;
import IScope = angular.IScope;
import { LanguageService } from '../../services/languageService';
import { ModelService } from '../../services/modelService';
import { ImportedNamespace, Model } from '../../services/entities';
import { AddEditRequireModal } from './addEditRequireModal';
import { comparingBoolean, comparingString } from '../../services/comparators';
import { Language } from '../../utils/language';
import { isDefined } from '../../utils/object';

const noExclude = (require: ImportedNamespace) => <string> null;

export class SearchRequireModal {
  /* @ngInject */
  constructor(private $uibModal: angular.ui.bootstrap.IModalService) {
  }

  open(model: Model, language: Language, exclude: (require: ImportedNamespace) => string = noExclude): angular.IPromise<ImportedNamespace> {
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

  searchResults: ImportedNamespace[];
  requires: ImportedNamespace[];
  searchText: string = '';
  showTechnical: boolean;
  loadingResults: boolean;

  /* @ngInject */
  constructor($scope: IScope,
              private $uibModalInstance: angular.ui.bootstrap.IModalServiceInstance,
              public  exclude: (require: ImportedNamespace) => string,
              private model: Model,
              private language: Language,
              private modelService: ModelService,
              private languageService: LanguageService,
              private addEditRequireModal: AddEditRequireModal) {

    this.loadingResults = true;

    modelService.getAllRequires().then(result => {
      this.requires = result;
      this.search();
    });

    $scope.$watch(() => this.searchText, () => this.search());
    $scope.$watch(() => this.showTechnical, () => this.search());
  }

  get showExcluded() {
    return !!this.searchText;
  }

  search() {
    if (this.requires) {
      this.searchResults = this.requires.filter(require =>
        this.textFilter(require)
        && this.excludedFilter(require)
        && this.showTechnicalFilter(require)
      );

      this.searchResults.sort(
        comparingBoolean((item: ImportedNamespace) => !!this.exclude(item))
          .andThen(comparingString((item: ImportedNamespace) => item.namespace)));

      this.loadingResults = !isDefined(this.requires);
    }
  }

  textFilter(require: ImportedNamespace) {
    const search = this.searchText.toLowerCase();

    function contains(text: string): boolean {
      return (text || '').toLowerCase().includes(search);
    }

    return !this.searchText || contains(this.languageService.translate(require.label, this.model)) || contains(require.namespace);
  }

  private excludedFilter(require: ImportedNamespace): boolean {
    return this.showExcluded || !this.exclude(require);
  }

  private showTechnicalFilter(require: ImportedNamespace): boolean {
    return this.showTechnical || !require.technical;
  }

  selectItem(require: ImportedNamespace) {
    if (!this.exclude(require)) {
      this.$uibModalInstance.close(require);
    }
  }

  createNew() {
    this.addEditRequireModal.openAdd(this.model, this.language)
      .then(require => this.$uibModalInstance.close(require));
  }

  close() {
    this.$uibModalInstance.dismiss();
  }
}
