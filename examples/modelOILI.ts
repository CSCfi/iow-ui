import { loader } from './exampleLoader';
import { ktkGroupId } from '../src/services/entityLoader';
import * as Jhs from './modelJHS';

export const model = loader.createProfile(ktkGroupId, {
  prefix: 'oili',
  label:   { fi: 'Opiskelijaksi ilmoittautuminen esimerkkiprofiili' },
  comment: { fi: 'Esimerkki profiilin ominaisuuksista OILI casella' },
  namespaces: [Jhs.model]
});

export namespace Attributes {
  export const aikaleima = loader.createAttribute(model, {
    label: { fi: 'Aikaleima' }
  });

  export const esitietojenTuontiaika = loader.createAttribute(model, {
    label: { fi: 'Esitietojen tuontiaika' }
  });

  export const ilmoittautumisaika = loader.createAttribute(model, {
    label: { fi: 'Ilmoittautumisaika' }
  });

  export const id = loader.createAttribute(model, {
    label: { fi: 'oili id' }
  });

  export const onYlioppilas = loader.createAttribute(model, {
    label: { fi: 'On ylioppilas' },
    dataType: 'xsd:boolean'
  });

  loader.assignPredicate(model, Jhs.Attributes.osoiteTeksti);
  loader.assignPredicate(model, Jhs.Attributes.ytunnus);
  loader.assignPredicate(model, Jhs.Attributes.postinumero);
  loader.assignPredicate(model, Jhs.Attributes.kadunnimi);
  loader.assignPredicate(model, Jhs.Attributes.puhelinnumero);
  loader.assignPredicate(model, Jhs.Attributes.sukunimi);
  loader.assignPredicate(model, Jhs.Attributes.etunimi);
}

export namespace Associations {

  export const meta = loader.createAssociation(model, {
    label: { fi: 'Meta' },
    valueClass: () => Classes.meta
  });

  loader.assignPredicate(model, Jhs.Associations.aidinkieli);
  loader.assignPredicate(model, Jhs.Associations.henkilo);
}

export namespace Classes {

  export const meta = loader.createClass(model, {
    label: { fi: 'Oilin metatiedot' },
    properties: [
      {
        predicate: Attributes.id,
        label:   { fi: 'Oili id' },
        comment: { fi: 'Oili-dokumentin yksilöivä tunniste' }
      },
      {
        predicate: Attributes.aikaleima,
        label:   { fi: 'Aikaleima' },
        comment: { fi: 'Oili-dokumentin viimeisin muokkausaika' },
        minCount: 1
      },
      {
        predicate: Attributes.esitietojenTuontiaika,
        label:   { fi: 'Esitietojen tuontiaika' },
        comment: { fi: 'Aikaleima tietojen hakemiselle opintopolusta' },
        minCount: 1,
        maxCount: 1
      },
      {
        predicate: Attributes.ilmoittautumisaika,
        label:   { fi: 'Ilmoittautumisaika' },
        comment: { fi: 'Aika, jolloin Oili-ilmoittautuminen on valmis' },
        minCount: 1
      }
    ]
  });

  export const epatarkkaOsoite = loader.specializeClass(model, {
    class: Jhs.Classes.osoite,
    id: 'sEpatarkkaOsoite',
    label: { fi: 'Epätarkka osoite' },
    properties: [
      {
        predicate: Jhs.Attributes.osoiteTeksti,
        label: { fi: 'Osoite tekstinä' },
        minCount: 1,
        maxCount: 1
      }
    ]
  });


  export const tarkkaOsoite = loader.specializeClass(model, {
    class: Jhs.Classes.osoite,
    id: 'sTarkkaOsoite',
    label: { fi: 'Tarkka osoite' },
    properties: [
      {
        predicate: Jhs.Attributes.ytunnus,
        label: { fi: 'Y-tunnus' },
        minCount: 1,
        maxCount: 1
      },
      {
        predicate: Jhs.Attributes.postinumero,
        label: { fi: 'Postinumero' },
        minCount: 1,
        maxCount: 1
      },
      {
        predicate: Jhs.Attributes.kadunnimi,
        label: { fi: 'Kadun nimi' },
        minCount: 1
      }
    ]
  });

  export const yhteystiedot = loader.specializeClass(model, {
    class: Jhs.Classes.yhteystieto,
    label: { fi: 'Yhteystiedot' }
  });

  export const osoite = loader.specializeClass(model, {
    class: Jhs.Classes.osoite,
    label: { fi: 'Osoite' },
    constraint: {
      comment: { fi: 'Rajoite joko tai' },
      type: 'or',
      shapes: [epatarkkaOsoite, tarkkaOsoite]
    },
    properties: [
      {
        predicate: Jhs.Attributes.puhelinnumero,
        label: { fi: 'Puhelinnumero' },
        minCount: 1,
        maxCount: 1
      }
    ]
  });

  export const henkilo = loader.specializeClass(model, {
    class: Jhs.Classes.henkilo,
    label: { fi: 'Henkilö' },
    constraint: {
      comment: { fi: 'Pakollisia yhteystietoja' },
      type: 'and',
      shapes: [yhteystiedot, osoite]
    },
    properties: [
      {
        predicate: Jhs.Associations.aidinkieli,
        label:   { fi: 'Äidinkieli' },
        comment: { fi: 'Hakijan tai opiskelijan äidinkieli' },
        valueClass: 'skos:Concept'
      },
      {
        predicate: Jhs.Attributes.sukunimi,
        label:   { fi: 'Sukunimi' },
        comment: { fi: 'Hakijan tai opiskelijan sukunimi' }
      },
      {
        predicate: Jhs.Attributes.etunimi,
        label:   { fi: 'Etunimet' },
        comment: { fi: 'Hakijan tai opiskelijan etunimet' },
        minCount: 1
      },
      {
        predicate: Attributes.onYlioppilas,
        label:   { fi: 'On ylioppilas' },
        comment: { fi: 'Hakijan tai opiskelijan on ylioppilas' },
        minCount: 1
      }
    ]
  });

  export const dokumentti = loader.createClass(model, {
    label: { fi: 'Oili dokumentti' },
    properties: [
      {
        predicate: Associations.meta,
        label:   { fi: 'Meta' },
        comment: { fi: 'Oilissa syntyvät metatiedot' },
        minCount: 1,
        maxCount: 1
      },
      {
        predicate: Jhs.Associations.henkilo,
        label:   { fi: 'Henkilö' },
        comment: { fi: 'Hakijan / opiskelijan henkilö- ja yhteystiedot' },
        valueClass: henkilo
      }
    ]
  });
}
