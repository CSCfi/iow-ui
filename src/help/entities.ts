export const exampleImportedLibrary = {
  prefix: 'jhs',
  namespaceId: 'http://iow.csc.fi/ns/jhs'
};

export const exampleLibrary = {
  prefix: 'testi',
  name: 'Testikirjasto'
};

export const exampleProfile = {
  prefix: 'plv',
  name: 'Palveluprofiili'
};

export const exampleNewClass = {
  name: 'Tuote',
  comment: 'asia joka tuotetaan',
  property: {
    attribute: {
      prefix: exampleImportedLibrary.prefix,
      namespaceId: exampleImportedLibrary.namespaceId,
      name: 'Nimi'
    },
    association: {
      searchName: 'Tuotetaan',
      name: 'Tuotetaan palvelussa',
      comment: 'tapahtumaketju joka toteuttaa jotain'
    }
  }
};

export const exampleAssignedClass = {
  namespaceId: exampleImportedLibrary.namespaceId,
  name: 'Palvelu'
};

const palveluNimiId = '6cfbd054-2bfc-4e92-8642-477b035f59ee';
const palveluKuvausId = 'fe884237-f6e2-44ea-ac97-231516da4770';

export const exampleSpecializedClass = {
  namespaceId: exampleImportedLibrary.namespaceId,
  name: 'Palvelu',
  properties: [palveluNimiId, palveluKuvausId]
};
