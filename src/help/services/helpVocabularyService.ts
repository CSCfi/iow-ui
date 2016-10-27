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

export class InteractiveHelpVocabularyService implements VocabularyService, ResetableService {

  private conceptSuggestions = new Map<string, ConceptSuggestion>();

  // With IE9 proxy-polyfill there cannot be any prototype methods not part of public api
  private getConceptSuggestionsByPredicate = (predicate: (conceptSuggestion: ConceptSuggestion) => boolean) => {
    const result: ConceptSuggestion[] = [];

    this.conceptSuggestions.forEach(conceptSuggestion => {
      if (predicate(conceptSuggestion)) {
        result.push(conceptSuggestion);
      }
    });

    return result;
  };

  /* @ngInject */
  constructor(private $q: IQService, private defaultVocabularyService: VocabularyService, private frameService: FrameService) {
  }

  reset(): IPromise<any> {
    this.conceptSuggestions.clear();
    return this.$q.when();
  }

  getAllVocabularies(): IPromise<Vocabulary[]> {
    return this.defaultVocabularyService.getAllVocabularies();
  }

  searchConcepts(vocabulary: Vocabulary, language: Language, searchText: string): IPromise<ConceptSearchResult[]>[] {
    return this.defaultVocabularyService.searchConcepts(vocabulary, language, searchText);
  }

  getConceptSuggestion(id: Uri): IPromise<ConceptSuggestion> {
    const conceptSuggestions = this.getConceptSuggestionsByPredicate(conceptSuggestion => conceptSuggestion.id.toString() === id.toString());

    if (conceptSuggestions.length > 0) {
      return this.$q.when(conceptSuggestions[0]);
    } else {
      return this.defaultVocabularyService.getConceptSuggestion(id);
    }
  }

  getConceptSuggestions(vocabularyId: Uri): IPromise<ConceptSuggestion[]> {
    return this.defaultVocabularyService.getConceptSuggestions(vocabularyId);
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
    return this.defaultVocabularyService.getConceptsForModel(model);
  }

  updateConceptSuggestion(conceptSuggestion: ConceptSuggestion): IPromise<any> {
    this.conceptSuggestions.set(conceptSuggestion.id.toString(), conceptSuggestion);
    return this.$q.when();
  }

  deleteConceptFromModel(concept: Concept, model: Model): IPromise<any> {
    return this.defaultVocabularyService.deleteConceptFromModel(concept, model);
  }

  deserializeConceptSuggestion(data: GraphData): IPromise<ConceptSuggestion> {
    return this.frameService.frameAndMap(data, true, frames.iowConceptFrame(data), () => ConceptSuggestion);
  }
}
