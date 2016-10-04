import { IPromise, ui } from 'angular';
import IModalService = ui.bootstrap.IModalService;
import IModalServiceInstance = ui.bootstrap.IModalServiceInstance;
import { ConceptService } from '../../services/conceptService';
import { comparingBoolean, comparingLocalizable } from '../../services/comparators';
import { Vocabulary, LanguageContext } from '../../services/entities';
import { LanguageService, Localizer } from '../../services/languageService';
import { all } from '../../utils/array';
import { Exclusion } from '../../utils/exclusion';
import { SearchController, SearchFilter } from '../filter/contract';

const noExclude = (_vocabulary: Vocabulary) => null;

export class SearchVocabularyModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(context: LanguageContext, exclude: Exclusion<Vocabulary> = noExclude): IPromise<Vocabulary> {
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

class SearchVocabularyController implements SearchController<Vocabulary> {

  searchResults: Vocabulary[] = [];
  vocabularies: Vocabulary[] = [];
  searchText: string = '';
  loadingResults: boolean;
  private localizer: Localizer;

  contentMatchers = [
    { name: 'Label', extractor: (vocabulary: Vocabulary) => vocabulary.title },
    { name: 'Description', extractor: (vocabulary: Vocabulary) => vocabulary.description }
  ];

  contentExtractors = this.contentMatchers.map(m => m.extractor);

  private searchFilters: SearchFilter<Vocabulary>[] = [];

  /* @ngInject */
  constructor(private $uibModalInstance: IModalServiceInstance,
              public exclude: Exclusion<Vocabulary>,
              conceptService: ConceptService,
              languageService: LanguageService,
              public context: LanguageContext) {

    this.localizer = languageService.createLocalizer(context);
    this.loadingResults = true;

    conceptService.getAllVocabularies().then(vocabularies => {
      this.vocabularies = vocabularies;

      this.vocabularies.sort(
        comparingBoolean<Vocabulary>(vocabulary => !!this.exclude(vocabulary))
          .andThen(comparingLocalizable<Vocabulary>(this.localizer, vocabulary => vocabulary.title)));

      this.search();
      this.loadingResults = false;
    });
  }

  addFilter(filter: SearchFilter<Vocabulary>) {
    this.searchFilters.push(filter);
  }

  get items() {
    return this.vocabularies;
  }

  search() {
    this.searchResults = this.vocabularies.filter(vocabulary => all(this.searchFilters, filter => filter(vocabulary)));
  }

  selectItem(vocabulary: Vocabulary) {
    if (!this.exclude(vocabulary)) {
      this.$uibModalInstance.close(vocabulary);
    }
  }

  close() {
    this.$uibModalInstance.dismiss();
  }
}
