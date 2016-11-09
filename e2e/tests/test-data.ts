import { Language } from '../../src/utils/language';
import { GroupPage } from '../pages/group/groupPage.po';
import { KnownModelType, KnownPredicateType } from '../../src/entities/type';
import { modelIdFromPrefix, classIdFromNamespaceId, predicateIdFromNamespaceId } from '../util/resource';

export const library2Parameters = {
  label: 'E2E Kirjasto2',
  prefix: 'e2e2',
  language: ['fi', 'en'] as Language[],
  groupId: GroupPage.JHS_ID,
  type: 'library' as KnownModelType,
  classes: {
    first: {
      name: 'Asia',
      conceptId: 'http://jhsmeta.fi/skos/J392'
    },
    second: {
      name: 'Henkilö',
      conceptId: 'http://jhsmeta.fi/skos/J7',
      properties: {
        first: {
          name: 'Property 1',
          type: 'attribute' as KnownPredicateType
        },
        second: {
          name: 'Yhteystieto',
          type: 'association' as KnownPredicateType,
          conceptId: 'http://jhsmeta.fi/skos/J110'
        },
        third: {
          name: 'Attribuutti 1',
          id: predicateIdFromNamespaceId(modelIdFromPrefix('e2e2'), 'Attribuutti 1')
        },
        fourth: {
          name: 'Assosiaatio 1',
          id: predicateIdFromNamespaceId(modelIdFromPrefix('e2e2'), 'Assosiaatio 1')
        }
      }
    }
  },
  attributes: {
    first: {
      name: 'Attribuutti 1'
    }
  },
  associations: {
    first: {
      name: 'Assosiaatio 1'
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
      name: 'Luokka 1',
    },
    second: {
      name: library2Parameters.classes.first.name,
      id: classIdFromNamespaceId(modelIdFromPrefix(library2Parameters.prefix), library2Parameters.classes.first.name)
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
      name: library2Parameters.classes.first.name,
      id: classIdFromNamespaceId(modelIdFromPrefix(library2Parameters.prefix), library2Parameters.classes.first.name)
    },
    second: {
      name: library2Parameters.classes.second.name,
      id: classIdFromNamespaceId(modelIdFromPrefix(library2Parameters.prefix), library2Parameters.classes.second.name)
    }
  }
};
