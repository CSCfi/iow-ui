import { VocabularyService, ConceptSearchResult } from '../../services/vocabularyService';
import { ResetableService } from './resetableService';
import { IPromise, IQService } from 'angular';
import { Language } from '../../utils/language';
import { Vocabulary, ConceptSuggestion, FintoConcept, Concept } from '../../entities/vocabulary';
import { Uri } from '../../entities/uri';
import { Model } from '../../entities/model';
import { GraphData } from '../../entities/contract';
import { FrameService } from '../../services/frameService';
import * as frames from '../../entities/frames';
import moment = require('moment');
import { dateSerializer } from '../../entities/serializer/serializer';
import { ResourceStore } from './resourceStore';

export class InteractiveHelpVocabularyService implements VocabularyService, ResetableService {

  store = new ResourceStore<ConceptSuggestion>();

  /* @ngInject */
  constructor(private $q: IQService, private defaultVocabularyService: VocabularyService, private frameService: FrameService) {
  }

  reset(): IPromise<any> {
    this.store.clear();
    return this.$q.when();
  }

  getAllVocabularies(): IPromise<Vocabulary[]> {
    return this.defaultVocabularyService.getAllVocabularies();
  }

  searchConcepts(vocabulary: Vocabulary, language: Language, searchText: string): IPromise<ConceptSearchResult[]>[] {
    return this.defaultVocabularyService.searchConcepts(vocabulary, language, searchText);
  }

  getConceptSuggestion(id: Uri): IPromise<ConceptSuggestion> {

    const conceptSuggestion = this.store.findFirst(cs => cs.id.equals(id));

    if (conceptSuggestion) {
      return this.$q.when(conceptSuggestion);
    } else {
      return this.defaultVocabularyService.getConceptSuggestion(id);
    }
  }

  getConceptSuggestions(vocabularyId: Uri): IPromise<ConceptSuggestion[]> {

    const storeSuggestions = this.store.findAll(cs => vocabularyId.equals(cs.vocabularyId));

    return this.defaultVocabularyService.getConceptSuggestions(vocabularyId)
      .then(suggestions => [...storeSuggestions, ...suggestions]);
  }

  createConceptSuggestion(vocabulary: Vocabulary, label: string, comment: string, _broaderConceptId: Uri|any, lang: Language, model: Model): IPromise<Uri> {

    const graph = {
      '@id': Uri.randomUUID().toString(),
      '@type': [ 'iow:ConceptSuggestion', 'skos:Concept' ],
      prefLabel: { [lang]: label },
      definition: { [lang]: comment },
      inScheme:  vocabulary.local ? `http://iow.csc.fi/ns/${model.prefix}/skos#` : vocabulary.id.toString(),
      atTime: dateSerializer.serialize(moment())
    };

    const result = new ConceptSuggestion(graph, model.context, frames.iowConceptFrame);
    return this.updateConceptSuggestion(result).then(() => result.id);
  }

  getFintoConcept(id: Uri): IPromise<FintoConcept> {
    return this.defaultVocabularyService.getFintoConcept(id);
  }

  getConceptsForModel(model: Model): IPromise<Concept[]> {
    // TODO should probably return suggestions from store also
    return this.defaultVocabularyService.getConceptsForModel(model);
  }

  updateConceptSuggestion(conceptSuggestion: ConceptSuggestion): IPromise<any> {
    this.store.add(conceptSuggestion);
    return this.$q.when();
  }

  deleteConceptFromModel(concept: Concept, model: Model): IPromise<any> {
    return this.defaultVocabularyService.deleteConceptFromModel(concept, model);
  }

  deserializeConceptSuggestion(data: GraphData): IPromise<ConceptSuggestion> {
    return this.frameService.frameAndMap(data, true, frames.iowConceptFrame(data), () => ConceptSuggestion);
  }
}
