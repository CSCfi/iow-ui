import { IPromise, IScope, ui } from 'angular';
import IModalService = ui.bootstrap.IModalService;
import IModalServiceInstance = ui.bootstrap.IModalServiceInstance;
import { ConceptService } from '../../services/conceptService';
import { comparingBoolean, comparingLocalizable } from '../../services/comparators';
import { localizableContains } from '../../utils/language';
import { isDefined } from '../../utils/object';
import { Vocabulary, LanguageContext } from '../../services/entities';
import { LanguageService, Localizer } from '../../services/languageService';
import { any } from '../../utils/array';

const noExclude = (vocabulary: Vocabulary) => <string> null;

export class SearchVocabularyModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(context: LanguageContext, exclude: (vocabulary: Vocabulary) => string = noExclude): IPromise<Vocabulary> {
    return this.$uibModal.open({
      template: require('./searchVocabularyModal.html'),
      size: 'medium',
      controller: SearchVocabularyController,
      controllerAs: 'ctrl',
      backdrop: true,
      resolve: {
        exclude: () => exclude,
        context: () => context
      }
    }).result;
  }
}

class SearchVocabularyController {

  searchResults: Vocabulary[];
  vocabularies: Vocabulary[];
  searchText: string = '';
  loadingResults: boolean;
  private localizer: Localizer;

  contentMatchers = [
    { name: 'Label', extractor: (vocabulary: Vocabulary) => vocabulary.title },
    { name: 'Description', extractor: (vocabulary: Vocabulary) => vocabulary.description }
  ];

  contentExtractors = this.contentMatchers.map(m => m.extractor);

  /* @ngInject */
  constructor($scope: IScope,
              private $uibModalInstance: IModalServiceInstance,
              public exclude: (vocabulary: Vocabulary) => string,
              conceptService: ConceptService,
              languageService: LanguageService,
              context: LanguageContext) {

    this.localizer = languageService.createLocalizer(context);
    this.loadingResults = true;

    conceptService.getAllVocabularies().then(vocabularies => {
      this.vocabularies = vocabularies;
      this.search();
    });

    $scope.$watch(() => this.searchText, () => this.search());
    $scope.$watch(() => this.showExcluded, () => this.search());
    $scope.$watchCollection(() => this.contentExtractors, () => this.search());
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
        comparingBoolean<Vocabulary>(vocabulary => !!this.exclude(vocabulary))
          .andThen(comparingLocalizable<Vocabulary>(this.localizer, vocabulary => vocabulary.title)));
    }

    this.loadingResults = !isDefined(this.vocabularies);
  }

  selectItem(vocabulary: Vocabulary) {
    if (!this.exclude(vocabulary)) {
      this.$uibModalInstance.close(vocabulary);
    }
  }

  private textFilter(vocabulary: Vocabulary): boolean {
    return !this.searchText || any(this.contentExtractors, extractor => localizableContains(extractor(vocabulary), this.searchText));
  }

  private excludedFilter(vocabulary: Vocabulary): boolean {
    return this.showExcluded || !this.exclude(vocabulary);
  }

  close() {
    this.$uibModalInstance.dismiss();
  }
}
