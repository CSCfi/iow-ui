import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import { ModelService } from '../../services/modelService';
import { CodeScheme, Model, CodeGroup } from '../../services/entities';
import { comparingBoolean, comparingString, comparingLocalizable } from '../../services/comparators';
import { isDefined } from '../../utils/object';
import { Localizer, LanguageService } from '../../services/languageService';

const noExclude = (codeScheme: CodeScheme) => <string> null;

export class SearchCodeSchemeModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService, private languageService: LanguageService) {
  }

  open(model: Model, exclude: (codeScheme: CodeScheme) => string = noExclude): IPromise<CodeScheme> {
    return this.$uibModal.open({
      template: require('./searchCodeSchemeModal.html'),
      size: 'medium',
      controller: SearchCodeSchemeModalController,
      controllerAs: 'ctrl',
      backdrop: true,
      resolve: {
        localizer: () => this.languageService.createLocalizer(model),
        exclude: () => exclude
      }
    }).result;
  }
}

export class SearchCodeSchemeModalController {

  searchResults: CodeScheme[];
  codeSchemes: CodeScheme[];
  codeGroups: CodeGroup[];
  showGroup: CodeGroup;
  searchText: string = '';
  loadingResults: boolean;

  /* @ngInject */
  constructor($scope: IScope,
              private $uibModalInstance: IModalServiceInstance,
              private modelService: ModelService,
              private localizer: Localizer,
              public exclude: (codeScheme: CodeScheme) => string) {

    this.loadingResults = true;

    modelService.getAllCodeSchemes().then(result => {
      this.codeSchemes = result;
      this.codeGroups = _.chain(this.codeSchemes)
        .map(codeScheme => codeScheme.groups)
        .flatten()
        .uniq(codeGroup => codeGroup.id.uri)
        .sort(comparingLocalizable<CodeGroup>(localizer.language, codeGroup => codeGroup.title))
        .value();

      this.search();
    });

    $scope.$watch(() => this.searchText, () => this.search());
    $scope.$watch(() => this.showExcluded, () => this.search());
    $scope.$watch(() => this.showGroup, () => this.search());
  }

  get showExcluded() {
    return !!this.searchText;
  }

  search() {
    if (this.codeSchemes) {
      this.searchResults = this.codeSchemes.filter(scheme =>
        this.textFilter(scheme) &&
        this.excludedFilter(scheme) &&
        this.groupFilter(scheme)
      );

      this.searchResults.sort(
        comparingBoolean((scheme: any) => !!this.exclude(scheme))
          .andThen(comparingString((scheme: any) => scheme.title)));
    }

    this.loadingResults = !isDefined(this.codeSchemes);
  }

  selectItem(codeScheme: CodeScheme) {
    if (!this.exclude(codeScheme)) {
      this.$uibModalInstance.close(codeScheme);
    }
  }

  private textFilter(codeScheme: CodeScheme): boolean {
    return !this.searchText || this.localizer.translate(codeScheme.title).toLowerCase().includes(this.searchText.toLowerCase());
  }

  private excludedFilter(codeScheme: CodeScheme): boolean {
    return this.showExcluded || !this.exclude(codeScheme);
  }

  private groupFilter(codeScheme: CodeScheme): boolean {
    return !this.showGroup || !!_.find(codeScheme.groups, codeGroup => codeGroup.id.equals(this.showGroup.id));
  }

  close() {
    this.$uibModalInstance.dismiss();
  }
}
