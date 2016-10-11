import { IHttpPromise, IHttpService, IPromise } from 'angular';
import * as _ from 'lodash';
import { upperCaseFirst } from 'change-case';
import { config } from '../config';
import { Uri, Url } from './uri';
import { Language } from '../utils/language';
import { requireDefined } from '../utils/object';
import { FrameService } from './frameService';
import { Localizable, GraphData } from '../entities/contract';
import { resolveConceptConstructor } from '../utils/entity';
import * as frames from '../entities/frames';
import { ConceptSuggestion, FintoConceptSearchResult, Vocabulary, Concept, FintoConcept } from '../entities/vocabulary';
import { Model } from '../entities/model';

export interface ConceptSearchResult {
  id: Uri;
  label: Localizable;
  suggestion: boolean;
  vocabulary: Vocabulary;
}

export class VocabularyService {
  /* @ngInject */
  constructor(private $http: IHttpService, private frameService: FrameService) {
  }

  getAllVocabularies(): IPromise<Vocabulary[]> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('conceptSchemes'))
      .then(response => this.deserializeVocabularies(response.data!));
  }

  searchConcepts(vocabulary: Vocabulary, language: Language, searchText: string): IPromise<ConceptSearchResult[]>[] {

    function mapResult(result: FintoConceptSearchResult|ConceptSuggestion) {
      return {
        id: result.id,
        label: result.label,
        suggestion: result instanceof ConceptSuggestion,
        vocabulary: vocabulary
      };
    }

    const conceptSuggestions = this.searchConceptSuggestions(searchText, language, vocabulary.id)
      .then(suggestions => _.map(suggestions, mapResult));

    const result = [conceptSuggestions];

    if (!vocabulary.local) {
      const concepts = this.searchFintoConcepts(searchText, language, requireDefined(vocabulary.vocabularyId))
        .then(suggestions => _.map(suggestions, mapResult));

      result.push(concepts);
    }

    return result;
}

  private searchFintoConcepts(query: string, lang: Language, vocabularyId: string): IPromise<FintoConceptSearchResult[]> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('conceptSearch'), {params: {term: query, lang, vocid: vocabularyId}})
      .then(response => this.deserializeFintoConceptSearchResults(response.data!));
  }

  private searchConceptSuggestions(query: string, lang: Language, vocabularyId: Uri): IPromise<ConceptSuggestion[]> {
    function suggestionContains(suggestion: ConceptSuggestion): boolean {
      const localization = suggestion.label[lang] || '';
      return localization.toLowerCase().includes(query.toLowerCase());
    }

    function matchingSuggestions(suggestions: ConceptSuggestion[]): ConceptSuggestion[] {
      return _.filter(suggestions, suggestion => suggestionContains(suggestion));
    }

    return this.getConceptSuggestions(vocabularyId).then(suggestions => matchingSuggestions(suggestions));
  }

  getConceptSuggestion(id: Uri): IPromise<ConceptSuggestion> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('conceptSuggestion'), {params: {conceptID: id.uri}})
      .then(response => this.deserializeConceptSuggestion(response.data!));
  }

  getConceptSuggestions(vocabularyId: Uri): IPromise<ConceptSuggestion[]> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('conceptSuggestion'), {params: {schemeID: vocabularyId.uri}})
      .then(response => this.deserializeConceptSuggestions(response.data!));
  }

  createConceptSuggestion(vocabulary: Vocabulary, label: string, comment: string, broaderConceptId: Uri|null, lang: Language, model: Model): IPromise<Uri> {
    return this.$http.put(config.apiEndpointWithName('conceptSuggestion'), null, {
      params: {
        schemeID: vocabulary.id.uri,
        label: upperCaseFirst(label),
        comment,
        lang,
        topConceptID: broaderConceptId && broaderConceptId.uri,
        modelID: model.id.uri
      }})
      .then((response: any) => new Uri(response.data['@id'], {}));
  }

  getFintoConcept(id: Uri): IPromise<FintoConcept> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('concept'), {params: {uri: id.uri}})
      .then(response => this.deserializeFintoConcept(response.data!, id.uri));
  }

  getConceptsForModel(model: Model): IPromise<Concept[]> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('modelConcepts'), {params: {model: model.id.uri}})
      .then(response => this.deserializeConcepts(response.data!));
  }

  updateConceptSuggestion(conceptSuggestion: ConceptSuggestion): IPromise<any> {
    const requestParams = {
      conceptID: conceptSuggestion.id.uri
    };

    return this.$http.post<GraphData>(config.apiEndpointWithName('conceptSuggestion'), conceptSuggestion.serialize(), {params: requestParams});
  }

  deleteConceptFromModel(concept: Concept, model: Model): IHttpPromise<any> {
    const requestParams = {
      id: concept.id.uri,
      model: model.id.uri
    };
    return this.$http.delete(config.apiEndpointWithName('modelConcepts'), {params: requestParams});
  }

  deserializeConceptSuggestion(data: GraphData): IPromise<ConceptSuggestion> {
    return this.frameService.frameAndMap(data, true, frames.iowConceptFrame(data), () => ConceptSuggestion);
  }

  deserializeConceptSuggestions(data: GraphData): IPromise<ConceptSuggestion[]> {
    return this.frameService.frameAndMapArray(data, frames.iowConceptFrame(data), () => ConceptSuggestion);
  }

  deserializeFintoConcept(data: GraphData, id: Url): IPromise<FintoConcept> {
    return this.frameService.frameAndMap(data, true, frames.fintoConceptFrame(data, id), () => FintoConcept);
  }

  deserializeFintoConceptSearchResults(data: GraphData): IPromise<FintoConceptSearchResult[]> {
    return this.frameService.frameAndMapArray(data, frames.fintoConceptSearchResultsFrame(data), () => FintoConceptSearchResult);
  }

  deserializeConcepts(data: GraphData): IPromise<Concept[]> {
    return this.frameService.frameAndMapArray(data, frames.iowConceptFrame(data), resolveConceptConstructor);
  }

  deserializeVocabularies(data: GraphData): IPromise<Vocabulary[]> {
    return this.frameService.frameAndMapArray(data, frames.vocabularyFrame(data), () => Vocabulary);
  }
}
