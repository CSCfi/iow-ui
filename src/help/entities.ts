import { modelIdFromPrefix } from '../../e2e/util/resource';
import { KnownPredicateType } from '../entities/type';

const palveluNimiId = '6cfbd054-2bfc-4e92-8642-477b035f59ee';
const palveluKuvausId = 'fe884237-f6e2-44ea-ac97-231516da4770';
const rekisterinumeroId = '1b029515-4ee3-44dd-ac27-b9d59888be21';
const lajikoodiId = '361ec89c-a723-4788-bd0d-927f414a1152';

export const exampleImportedLibrary = {
  prefix: 'jhs',
  namespaceId: 'http://iow.csc.fi/ns/jhs'
};

export const exampleLibrary = {
  prefix: 'sea',
  name: 'Merenkulun tietokomponentit',
  comment: 'Merenkulkuun liittyvät tietosisällöt',
  importedLibrary: exampleImportedLibrary,
  newClass: {
    name: 'Vene',
    comment: 'Vedessä kulkeva alus, joka on laivaa pienempi',
    superClass: {
      namespaceId: exampleImportedLibrary.namespaceId,
      name: 'Liikenneväline',
      properties: [rekisterinumeroId, lajikoodiId]
    },
    property: {
      name: {
        type: 'attribute' as KnownPredicateType,
        prefix: exampleImportedLibrary.prefix,
        namespaceId: exampleImportedLibrary.namespaceId,
        name: 'Nimi'
      },
      passengers: {
        type: 'attribute' as KnownPredicateType,
        searchName: 'Matkustajien lukumäärä',
        name: 'Matkustajien lukumäärä',
        comment: 'Matkustajien lukumäärä'
      },
      owner: {
        type: 'association' as KnownPredicateType,
        searchName: 'Omistaja',
        name: 'Omistaja',
        conceptId: 'http://jhsmeta.fi/skos/J197',
        target: {
          namespaceId: exampleImportedLibrary.namespaceId,
          name: 'Henkilö'
        }
      }
    }
  },
  person: {
    namespaceId: exampleImportedLibrary.namespaceId,
    name: 'Henkilö'
  },
  contact: {
    namespaceId: exampleImportedLibrary.namespaceId,
    name: 'Yhteystiedot'
  },
  address: {
    namespaceId: exampleImportedLibrary.namespaceId,
    name: 'Osoite'
  }
};

export const exampleProfile = {
  prefix: 'plv',
  name: 'Palveluprofiili',
  importedLibrary: exampleImportedLibrary,
  newClass: {
    name: 'Tuote',
    comment: 'Asia joka tuotetaan',
    property: {
      name: {
        type: 'attribute' as KnownPredicateType,
        prefix: exampleImportedLibrary.prefix,
        namespaceId: exampleImportedLibrary.namespaceId,
        name: 'Nimi'
      },
      produced: {
        type: 'association' as KnownPredicateType,
        searchName: 'Tuotetaan',
        name: 'Tuotetaan palvelussa',
        comment: 'tapahtumaketju joka toteuttaa jotain',
        target: {
          namespaceId: modelIdFromPrefix('plv'),
          name: 'Palvelu'
        }
      }
    }
  },
  specializedClass: {
    namespaceId: exampleImportedLibrary.namespaceId,
    name: 'Palvelu',
    properties: [palveluNimiId, palveluKuvausId]
  }
};
