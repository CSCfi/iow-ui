import IModalService = angular.ui.bootstrap.IModalService;
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import { ConceptService } from '../../services/conceptService';
import { comparingBoolean, comparingLocalizable } from '../../services/comparators';
import { Language } from '../../utils/language';
import { isDefined } from '../../utils/object';
import { Vocabulary } from '../../services/entities';
import { LanguageService } from '../../services/languageService';

const noExclude = (vocabulary: Vocabulary) => <string> null;

export class SearchVocabularyModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(language: Language, exclude: (vocabulary: Vocabulary) => string = noExclude): IPromise<Vocabulary> {
    return this.$uibModal.open({
      template: require('./searchVocabularyModal.html'),
      size: 'medium',
      controller: SearchVocabularyController,
      controllerAs: 'ctrl',
      backdrop: true,
      resolve: {
        exclude: () => exclude,
        language: () => language
      }
    }).result;
  }
}

class SearchVocabularyController {

  searchResults: Vocabulary[];
  vocabularies: Vocabulary[];
  searchText: string = '';
  loadingResults: boolean;

  /* @ngInject */
  constructor($scope: IScope,
              private $uibModalInstance: IModalServiceInstance,
              public exclude: (vocabulary: Vocabulary) => string,
              private conceptService: ConceptService,
              private languageService: LanguageService,
              private language: Language) {

    this.loadingResults = true;

    conceptService.getAllVocabularies(language).then(vocabularies => {
      this.vocabularies = vocabularies;
      this.search();
    });

    $scope.$watch(() => this.searchText, () => this.search());
    $scope.$watch(() => this.showExcluded, () => this.search());
  }

  get showExcluded() {
    return !!this.searchText;
  }

  search() {
    if (this.vocabularies) {
      this.searchResults = this.vocabularies.filter(vocabulary =>
        this.textFilter(vocabulary) &&
        this.excludedFilter(vocabulary)
      );

      this.searchResults.sort(
        comparingBoolean((vocabulary: Vocabulary) => !!this.exclude(vocabulary))
          .andThen(comparingLocalizable(this.language, (vocabulary: Vocabulary) => vocabulary.label)));
    }

    this.loadingResults = !isDefined(this.vocabularies);
  }

  selectItem(vocabulary: Vocabulary) {
    if (!this.exclude(vocabulary)) {
      this.$uibModalInstance.close(vocabulary);
    }
  }

  private localizedLabelAsLower(vocabulary: Vocabulary): string {
    return this.languageService.translate(vocabulary.label).toLowerCase();
  }

  private textFilter(vocabulary: Vocabulary): boolean {
    return !this.searchText || this.localizedLabelAsLower(vocabulary).includes(this.searchText.toLowerCase());
  }

  private excludedFilter(vocabulary: Vocabulary): boolean {
    return this.showExcluded || !this.exclude(vocabulary);
  }

  close() {
    this.$uibModalInstance.dismiss();
  }
}
