import { Language } from '../../src/utils/language';
import { GroupPage } from '../pages/group/groupPage.po';
import { KnownModelType, ClassType, KnownPredicateType } from '../../src/entities/type';
import { modelIdFromPrefix, classIdFromNamespaceId, predicateIdFromNamespaceId } from '../util/resource';
import {
  fromConceptSuggestion, fromExistingResource, fromExternalResource,
  fromExistingConcept
} from '../pages/model/modelPage.po';

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
      classType: 'class' as ClassType
    },
    second: {
      origin: fromExistingConcept({
        name: 'Henkilö',
        conceptId: 'http://jhsmeta.fi/skos/J7'
      }),
      classType: 'class' as ClassType,
      properties: {
        first: {
          origin: fromConceptSuggestion({
            name: 'Property 1'
          }),
          predicateType: 'attribute' as KnownPredicateType,
          index: 0
        },
        second: {
          origin: fromExistingConcept({
            name: 'Yhteystieto',
            conceptId: 'http://jhsmeta.fi/skos/J110'
          }),
          predicateType: 'association' as KnownPredicateType,
          index: 1
        },
        third: {
          origin: fromExistingResource({
            name: 'Attribuutti 1',
            id: predicateIdFromNamespaceId(modelIdFromPrefix('e2e2'), 'Attribuutti 1')
          }),
          predicateType: 'attribute' as KnownPredicateType,
          index: 2
        },
        fourth: {
          origin: fromExistingResource({
            name: 'Assosiaatio 1',
            id: predicateIdFromNamespaceId(modelIdFromPrefix('e2e2'), 'Assosiaatio 1')
          }),
          predicateType: 'association' as KnownPredicateType,
          index: 3
        }
      }
    }
  },
  attributes: {
    first: {
      origin: fromConceptSuggestion({
        name: 'Attribuutti 1'
      }),
      predicateType: 'attribute' as KnownPredicateType
    }
  },
  associations: {
    first: {
      origin: fromConceptSuggestion({
        name: 'Assosiaatio 1'
      }),
      predicateType: 'association' as KnownPredicateType
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
      classType: 'class' as ClassType
    },
    second: {
      origin: fromExistingResource({
        name: library2Parameters.classes.first.origin.name,
        id: classIdFromNamespaceId(modelIdFromPrefix(library2Parameters.prefix), library2Parameters.classes.first.origin.name)
      }),
      classType: 'class' as ClassType
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
        id: classIdFromNamespaceId(modelIdFromPrefix(library2Parameters.prefix), library2Parameters.classes.first.origin.name)
      }),
      classType: 'shape' as ClassType,
      properties: {
        first: {
          origin: fromExternalResource({
            name: 'Luotu',
            id: 'http://purl.org/dc/terms/created'
          }),
          predicateType: 'attribute' as KnownPredicateType,
          index: 0
        }
      }
    },
    second: {
      origin: fromExistingResource({
        name: library2Parameters.classes.second.origin.name,
        id: classIdFromNamespaceId(modelIdFromPrefix(library2Parameters.prefix), library2Parameters.classes.second.origin.name)
      }),
      classType: 'shape' as ClassType
    },
    third: {
      origin: fromExternalResource({
        name: 'Sijainti',
        id: 'http://purl.org/dc/terms/Location'
      }),
      classType: 'shape' as ClassType
    }
  }
};
