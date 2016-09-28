import { IPromise, IScope, ui } from 'angular';
import IModalService = ui.bootstrap.IModalService;
import IModalServiceInstance = ui.bootstrap.IModalServiceInstance;
import { LanguageService } from '../../services/languageService';
import { ModelService } from '../../services/modelService';
import { ImportedNamespace, Model } from '../../services/entities';
import { AddEditNamespaceModal } from './addEditNamespaceModal';
import { comparingBoolean, comparingString } from '../../services/comparators';
import { Language, localizableContains } from '../../utils/language';
import { isDefined } from '../../utils/object';

const noExclude = (ns: ImportedNamespace) => <string> null;

export class SearchNamespaceModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(model: Model, language: Language, exclude: (ns: ImportedNamespace) => string = noExclude): IPromise<ImportedNamespace> {
    return this.$uibModal.open({
      template: require('./searchNamespaceModal.html'),
      size: 'medium',
      controller: SearchNamespaceController,
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

class SearchNamespaceController {

  searchResults: ImportedNamespace[];
  namespaces: ImportedNamespace[];
  searchText: string = '';
  showTechnical: boolean;
  loadingResults: boolean;

  /* @ngInject */
  constructor($scope: IScope,
              private $uibModalInstance: IModalServiceInstance,
              public  exclude: (ns: ImportedNamespace) => string,
              private model: Model,
              private language: Language,
              private modelService: ModelService,
              private languageService: LanguageService,
              private addEditNamespaceModal: AddEditNamespaceModal) {

    this.loadingResults = true;

    modelService.getAllImportableNamespaces().then(result => {
      this.namespaces = result;
      this.search();
    });

    $scope.$watch(() => this.searchText, () => this.search());
    $scope.$watch(() => this.showTechnical, () => this.search());
  }

  get showExcluded() {
    return !!this.searchText;
  }

  search() {
    if (this.namespaces) {
      this.searchResults = this.namespaces.filter(ns =>
        this.textFilter(ns)
        && this.excludedFilter(ns)
        && this.showTechnicalFilter(ns)
      );

      this.searchResults.sort(
        comparingBoolean((item: ImportedNamespace) => !!this.exclude(item))
          .andThen(comparingString((item: ImportedNamespace) => item.namespace)));

      this.loadingResults = !isDefined(this.namespaces);
    }
  }

  textFilter(ns: ImportedNamespace) {
    const search = this.searchText.toLowerCase();

    function contains(text: string): boolean {
      return (text || '').toLowerCase().includes(search);
    }

    return !this.searchText || contains(this.languageService.translate(ns.label, this.model)) || contains(ns.namespace);
  }

  private excludedFilter(ns: ImportedNamespace): boolean {
    return this.showExcluded || !this.exclude(ns);
  }

  private showTechnicalFilter(ns: ImportedNamespace): boolean {
    return this.showTechnical || !ns.technical;
  }

  selectItem(ns: ImportedNamespace) {
    if (!this.exclude(ns)) {
      this.$uibModalInstance.close(ns);
    }
  }

  createNew() {
    this.addEditNamespaceModal.openAdd(this.model, this.language)
      .then(ns => this.$uibModalInstance.close(ns));
  }

  close() {
    this.$uibModalInstance.dismiss();
  }
}
