import { loader } from './exampleLoader';
import { ktkGroupId } from '../src/services/entityLoader';
import * as Jhs from './modelJHS';
import * as Edu from './modelEDU';

export const model = loader.createProfile(ktkGroupId, {
  prefix: 'oili',
  label:   { fi: 'Opiskelijaksi ilmoittautuminen esimerkkiprofiili' },
  comment: { fi: 'Esimerkki profiilin ominaisuuksista OILI casella' },
  requires: [Jhs.model, Edu.model]
});

export namespace Attributes {
}

export namespace Associations {
}

export namespace Classes {
  const yhteystiedot = loader.specializeClass(model, {
    class: Jhs.Classes.yhteystieto,
    label: { fi: 'Yhteystiedot' }
  });
}
