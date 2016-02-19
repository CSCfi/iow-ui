import { loader } from './exampleLoader';
import { ktkGroupId } from '../src/services/entityLoader';
import * as Jhs from './modelJHS';

export const model = loader.createLibrary(ktkGroupId, {
  prefix: 'edu',
  label:   { fi: 'Opiskelun, opetuksen ja koulutuksen tietokomponentit',
    en: 'Core Vocabulary of Education' },
  comment: { fi: 'Opiskelun, opetuksen ja koulutuksen yhteiset tietokomponentit',
    en: 'Common core data model of teaching, learning and education' },
  requires: [Jhs.model]
});

export namespace Attributes {
  const kuvausTeksti = loader.assignPredicate(model, Jhs.Attributes.kuvausteksti);
}

export namespace Associations {
}

export namespace Classes {
  const organisaatio = loader.assignClass(model, Jhs.Classes.organisaatio);
}

