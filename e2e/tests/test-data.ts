import { Language } from '../../src/utils/language';
import { GroupPage } from '../pages/group/groupPage.po';
import { KnownModelType, ClassType, KnownPredicateType } from '../../src/entities/type';
import {
  fromExistingConcept, fromExistingResource, fromConceptSuggestion, fromExternalResource,
  predicateIdFromPrefix, classIdFromPrefix
} from '../util/resource';

export const library2Parameters = {
  label: 'E2E Kirjasto2',
  prefix: 'e2e2',
  language: ['fi', 'en'] as Language[],
  groupId: GroupPage.JHS_ID,
  type: 'library' as KnownModelType,
  classes: {
    first: {
      origin: fromExistingConcept({
        name: 'Asia',
        conceptId: 'http://jhsmeta.fi/skos/J392'
      }),
      type: 'class' as ClassType
    },
    second: {
      origin: fromExistingConcept({
        name: 'Henkilö',
        conceptId: 'http://jhsmeta.fi/skos/J7'
      }),
      type: 'class' as ClassType,
      properties: [
        {
          origin: fromConceptSuggestion({
            name: 'Property 1'
          }),
          type: 'attribute' as KnownPredicateType,
        },
        {
          origin: fromExistingConcept({
            name: 'Yhteystieto',
            conceptId: 'http://jhsmeta.fi/skos/J110'
          }),
          type: 'association' as KnownPredicateType,
        },
        {
          origin: fromExistingResource({
            name: 'Attribuutti 1',
            id: predicateIdFromPrefix('e2e2', 'Attribuutti 1'),
          }),
          type: 'attribute' as KnownPredicateType,
        },
        {
          origin: fromExistingResource({
            name: 'Assosiaatio 1',
            id: predicateIdFromPrefix('e2e2', 'Assosiaatio 1')
          }),
          type: 'association' as KnownPredicateType,
        }
      ]
    }
  },
  attributes: {
    first: {
      origin: fromConceptSuggestion({
        name: 'Attribuutti 1'
      }),
      type: 'attribute' as KnownPredicateType
    }
  },
  associations: {
    first: {
      origin: fromConceptSuggestion({
        name: 'Assosiaatio 1'
      }),
      type: 'association' as KnownPredicateType
    }
  }
};

export const library1Parameters = {
  label: 'E2E Kirjasto',
  prefix: 'e2e',
  language: ['fi', 'en'] as Language[],
  groupId: GroupPage.JHS_ID,
  type: 'library' as KnownModelType,
  classes: {
    first: {
      origin: fromConceptSuggestion({
        name: 'Luokka 1'
      }),
      type: 'class' as ClassType
    },
    second: {
      origin: fromExistingResource({
        name: library2Parameters.classes.first.origin.name,
        id: classIdFromPrefix(library2Parameters.prefix, library2Parameters.classes.first.origin.name)
      }),
      type: 'class' as ClassType
    }
  }
};

export const profileParameters = {
  label: 'E2E Profiili',
  prefix: 'e2ep',
  language: ['fi', 'en'] as Language[],
  groupId: GroupPage.JHS_ID,
  type: 'profile' as KnownModelType,
  classes: {
    first: {
      origin: fromExistingResource({
        name: library2Parameters.classes.first.origin.name,
        id: classIdFromPrefix(library2Parameters.prefix, library2Parameters.classes.first.origin.name)
      }),
      type: 'shape' as ClassType,
      properties: [
        {
          origin: fromExternalResource({
            name: 'Luotu',
            id: 'http://purl.org/dc/terms/created'
          }),
          type: 'attribute' as KnownPredicateType
        }
      ]
    },
    second: {
      origin: fromExistingResource({
        name: library2Parameters.classes.second.origin.name,
        id: classIdFromPrefix(library2Parameters.prefix, library2Parameters.classes.second.origin.name)
      }),
      type: 'shape' as ClassType
    },
    third: {
      origin: fromExternalResource({
        name: 'Sijainti',
        id: 'http://purl.org/dc/terms/Location'
      }),
      type: 'shape' as ClassType
    }
  }
};
