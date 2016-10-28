import { KnownPredicateType } from '../entities/type';
export const exampleImportedLibrary = {
  prefix: 'jhs'
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
    prefix: exampleImportedLibrary.prefix,
    name: 'Nimi',
    type: 'attribute' as KnownPredicateType
  }
};

const palveluNimiId = '6cfbd054-2bfc-4e92-8642-477b035f59ee';
const palveluKuvausId = 'fe884237-f6e2-44ea-ac97-231516da4770';

export const exampleSpecializedClass = {
  name: 'Palvelu',
  properties: [palveluNimiId, palveluKuvausId]
};
