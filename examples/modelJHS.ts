import { loader } from './exampleLoader';
import { jhsGroupId } from '../src/services/entityLoader';

export const model = loader.createLibrary(jhsGroupId, {
  prefix: 'jhs',
  label:   { fi: 'Julkishallinnon tietokomponentit' },
  comment: { fi: 'Julkisessa hallinnossa ja kaikilla toimialoilla yleisesti käytössä olevat tietosisällöt' },
  references: ['eos']
});

export namespace Associations {

  export const aidinkieli = loader.createAssociation(model, {
    label: { fi: 'Äidinkieli' }
  });

  export const ammatti = loader.createAssociation(model, {
    label: { fi: 'Ammatti' }
  });

  export const viittausAsiaan = loader.createAssociation(model, {
    label: { fi: 'Viittaus asiaan' }
  });

  export const asianosainen = loader.createAssociation(model, {
    label: { fi: 'Asianosainen' }
  });

  export const henkilo = loader.createAssociation(model, {
    label: { fi: 'Henkilö' },
    valueClass: () => Classes.henkilo
  });

  export const kansalaisuus = loader.createAssociation(model, {
    label: { fi: 'Kansalaisuus' },
    valueClass: 'skos:Concept'
  });

  export const koodi = loader.createAssociation(model, {
    id: 'koodi',
    label: { fi: 'Viittaus koodistossa rajattuun luokitukseen' },
    valueClass: 'skos:Concept'
  });

  export const organisaatio = loader.createAssociation(model, {
    label: { fi: 'Organisaatio' }
  });

  export const osoite = loader.createAssociation(model, {
    label: { fi: 'Osoite' }
  });

  export const siviilisaaty = loader.createAssociation(model, {
    label: { fi: 'Siviilisääty' }
  });

  export const viittaussuhde = loader.createAssociation(model, {
    label: { fi: 'Viittaussuhde' }
  });

  export const yhteystiedot = loader.createAssociation(model, {
    label: { fi: 'Yhteystiedot' }
  });
}

export namespace Attributes {

  export const alkamisaika = loader.createAttribute(model, {
    label: { fi: 'Alkamisaika' },
    dataType: 'xsd:dateTime'
  });

  export const alkamishetki = loader.createAttribute(model, {
    label: { fi: 'Alkamishetki' },
    dataType: 'xsd:dateTime'
  });

  export const alkamiskuukausi = loader.createAttribute(model, {
    label: { fi: 'Alkamiskuukausi' },
    dataType: 'xsd:dateTime'
  });

  export const alkamispaiva = loader.createAttribute(model, {
    label: { fi: 'Alkamispäivä' },
    dataType: 'xsd:dateTime'
  });

  export const alkamispvm = loader.createAttribute(model, {
    label: { fi: 'Alkamispäivämäärä' },
    dataType: 'xsd:dateTime'
  });

  export const alkamisvuosi = loader.createAttribute(model, {
    label: { fi: 'Alkamisvuosi' },
    dataType: 'xsd:dateTime'
  });

  export const paattymishetki = loader.createAttribute(model, {
    label: { fi: 'Päättymishetki' },
    dataType: 'xsd:dateTime'
  });

  export const paattymisaika = loader.createAttribute(model, {
    label: { fi: 'Päättymisaika' },
    dataType: 'xsd:dateTime'
  });

  export const paattymiskuukausi = loader.createAttribute(model, {
    label: { fi: 'Päättymiskuukausi' },
    dataType: 'xsd:dateTime'
  });

  export const paattymispaiva = loader.createAttribute(model, {
    label: { fi: 'Päättymispäivä' },
    dataType: 'xsd:dateTime'
  });

  export const paattymispaivamaara = loader.createAttribute(model, {
    label: { fi: 'Päättymispäivämäärä' },
    dataType: 'xsd:dateTime'
  });

  export const paattymisvuosi = loader.createAttribute(model, {
    label: { fi: 'Päättymisvuosi' },
    dataType: 'xsd:dateTime'
  });

  export const aiheteksti = loader.createAttribute(model, {
    label: { fi: 'Aiheteksti' }
  });

  export const asiatunnus = loader.createAttribute(model, {
    label: { fi: 'Asiatunnus' }
  });

  export const asiasana = loader.createAttribute(model, {
    label: { fi: 'Asiasana' },
    dataType: 'xsd:string'
  });

  export const etunimi = loader.createAttribute(model, {
    label: { fi: 'Etunimi' },
    dataType: 'xsd:string'
  });

  export const henkilotunnus = loader.createAttribute(model, {
    label: { fi: 'Henkilotunnus' },
    dataType: 'xsd:string'
  });

  export const jakokirjain = loader.createAttribute(model, {
    label: { fi: 'Jakokirjain' },
    dataType: 'xsd:string'
  });

  export const kadunnimi = loader.createAttribute(model, {
    label: { fi: 'Kadunnimi' },
    dataType: 'xsd:string'
  });

  export const kirjainosa = loader.createAttribute(model, {
    label: { fi: 'Kirjainosa' }
  });

  export const korvaavuussuhdeTeksti = loader.createAttribute(model, {
    label: { fi: 'Korvaavuussuhde teksti' }
  });

  export const kuvausteksti = loader.createAttribute(model, {
    label: { fi: 'Kuvausteksti' },
    dataType: 'xsd:string'
  });

  export const nimeke = loader.createAttribute(model, {
    label: { fi: 'Nimeke' },
    dataType: 'xsd:string'
  });

  export const nimi = loader.createAttribute(model, {
    label: { fi: 'Nimi' },
    dataType: 'xsd:string'
  });

  export const numero = loader.createAttribute(model, {
    label: { fi: 'Numero' },
    dataType: 'xsd:integer'
  });

  export const osoiteNumero = loader.createAttribute(model, {
    label: { fi: 'Osoite numero' },
    dataType: 'xsd:integer'
  });

  export const osoiteTeksti = loader.createAttribute(model, {
    label: { fi: 'Osoiteteksti' },
    dataType: 'xsd:string'
  });

  export const postilokero = loader.createAttribute(model, {
    label: { fi: 'Postilokeron osoiteteksti' },
    dataType: 'xsd:string'
  });

  export const postinumero = loader.createAttribute(model, {
    label: { fi: 'Postinumero' },
    dataType: 'xsd:string'
  });

  export const puhelinnumero = loader.createAttribute(model, {
    label: { fi: 'Puhelinnumero' }
  });

  export const selite = loader.createAttribute(model, {
    label: { fi: 'Selite' }
  });

  export const sukunimi = loader.createAttribute(model, {
    label: { fi: 'Sukunimi' }
  });

  export const tehtavakoodi = loader.createAttribute(model, {
    label: { fi: 'Tehtäväkoodi' }
  });

  export const tunniste = loader.createAttribute(model, {
    label: { fi: 'Tunniste' }
  });

  export const tunnus = loader.createAttribute(model, {
    label: { fi: 'Tunnus' }
  });

  export const tyyppi = loader.createAttribute(model, {
    label: { fi: 'Tyyppi' }
  });

  export const viittaussuhdeteksti = loader.createAttribute(model, {
    label: { fi: 'Viittaussuhdeteksti' }
  });

  export const ytunnus = loader.createAttribute(model, {
    label: { fi: 'Y-tunnus' },
    dataType: 'xsd:string'
  });
}

export namespace Classes {

  export const aikavali = loader.createClass(model, {
    label:   { fi: 'Aikaväli' },
    comment: { fi: 'Ajankohdista muodostuva ajallinen jatkumo' },
    properties: [
      {
        predicate: Attributes.alkamishetki,
        label: { fi: 'Aikavälin alkamishetki' }
      },
      {
        predicate: Attributes.paattymishetki,
        label: { fi: 'Aikavälin päättymishetki' }
      }
    ]
  });

  export const ajanjakso = loader.createClass(model, {
    label: { fi: 'Ajanjakso' },
    comment: { fi: 'Nimetty aikaväli, joka voidaan määritellä eri tarkkuudella'  },
    subClassOf: aikavali,
    properties: [
      {
        predicate: Attributes.alkamisaika,
        label: { fi: 'Ajanjakson alkamisaika' }
      },
      {
        predicate: Attributes.alkamisvuosi,
        label: { fi: 'Ajanjakson alkamisvuosi' }
      },
      {
        predicate: Attributes.alkamiskuukausi,
        label: { fi: 'Ajanjakson alkamiskuukausi' }
      },
      {
        predicate: Attributes.alkamispvm,
        label: { fi: 'Ajanjakson alkamispäivämäärä' }
      },
      {
        predicate: Attributes.alkamishetki,
        label: { fi: 'Ajanjakson alkamishetki' }
      },
      {
        predicate: Attributes.paattymishetki,
        label: { fi: 'Ajanjakson päättymishetki' }
      },
      {
        predicate: Attributes.paattymisaika,
        label: { fi: 'Ajanjakson päättymisaika' }
      },
      {
        predicate: Attributes.paattymispaivamaara,
        label: { fi: 'Ajanjakson päättymispäivämäärä' }
      },
      {
        predicate: Attributes.nimi,
        label: { fi: 'Ajanjaksolle määritelty nimi' }
      },
    ]
  });

  export const henkilo = loader.createClass(model, {
    label: { fi: 'Henkilö'  },
    concept: {
      label: 'Henkilön käsite',
      comment: 'Henkilön määritelmä'
    },
    equivalentClasses: ['schema:Person', 'foaf:Person'],
    properties: [
      {
        predicate: Associations.aidinkieli,
        label: { fi: 'Henkilön äidinkieli' },
        valueClass: 'skos:Concept'
      },
      {
        predicate: Attributes.etunimi,
        label: { fi: 'Henkilön etunimi' }
      },
      {
        predicate: Attributes.sukunimi,
        label: { fi: 'Henkilön sukunimi' }
      },
      {
        predicate: Associations.ammatti,
        label: { fi: 'Ammatti' },
        valueClass: 'skos:Concept'
      },
      {
        predicate: Attributes.henkilotunnus,
        label: { fi: 'Henkilön henkilötunnus' },
        pattern: '\\d{6}[+-A]\\d{3}[0-9ABCDEFHJKLMNPRSTUVWXY]'
      },
      {
        predicate: Associations.siviilisaaty,
        label: { fi: 'Henkilön siviilisääty' },
        valueClass: 'skos:Concept'
      },
      {
        predicate: Associations.kansalaisuus,
        label: { fi: 'Henkilön kansalaisuus' },
        valueClass: 'skos:Concept'
      }
    ]
  });

  export const asia = loader.createClass(model, {
    label:   { fi: 'Asia' },
    comment: { fi : 'Tehtävän yksittäinen instanssi, joka käsitellään prosessin mukaisessa menettelyssä.' },
    properties: [
      {
        predicate: Attributes.korvaavuussuhdeTeksti,
        label:   { fi: 'Asian korvaavuussuhde' },
        comment: { fi: 'Edellisen asian voimassaolo on esimerkiksi päättynyt, minkä johdosta aiempi asia on jouduttu korvaamaan uudella.' }
      },
      {
        predicate: Attributes.tehtavakoodi,
        label:   { fi: 'Asian tehtäväkoodi' },
        comment: { fi: 'Julkisen hallinnon yhteisen tai organisaation oman tehtäväluokituksen mukainen tehtävä.' }
      },
      {
        predicate: Attributes.aiheteksti,
        label:   { fi: 'Asian aiheteksti' },
        comment: { fi: 'Asiaan liittyvä aihe, ilmiö tai teema. Aiheella voidaan luokitella asioita erilaisiin kokonaisuuksiin tai ryhmiin. Hyödynnetään esimerkiksi raportointi- ja hakunäkymien rakentamisessa tietojärjestelmissä.' }
      },
      {
        predicate: Attributes.asiatunnus,
        label:   { fi: 'Asiatunnus' },
        comment: { fi: 'Asiatunnus voidaan muodostaa organisaatiokohtaisesti tai organisaatioiden välillä yhteisesti sovitulla tavalla' }
      },
      {
        predicate: Attributes.nimeke,
        label:   { fi: 'Nimeke' },
        comment: { fi: 'Asian nimitys' }
      },
      {
        predicate: Attributes.asiasana,
        label:   { fi: 'Asian asiasana',
                   en: 'Keyword' },
        comment: { fi: 'Asian sisältöä kuvaileva tieto' }
      },
      {
        predicate: Attributes.viittaussuhdeteksti,
        label:   { fi: 'Asian viittaussuhde' },
        comment: { fi: 'Viittaussuhdetta voi käyttää esim. osoittamaan eri asiatunnuksella esiintyviä hakemuksia, jotka ratkaistaan samalla päätöksellä.' }
      },
      {
        predicate: Associations.asianosainen,
        label:   { fi: 'Asianosainen' },
        comment: { fi: 'Asian asianosaiset' },
        valueClass: henkilo
      }
    ]
  });

  export const asiakirja = loader.createClass(model, {
    label: { fi: 'Asiakirja'  },
    equivalentClasses: ['foaf:Document'],
    properties: [
      {
        predicate: Associations.viittausAsiaan,
        label: { fi: 'Viittaus asiakirjassa käsiteltävään asiaan' },
        valueClass: asia
      },
      {
        predicate: Attributes.asiatunnus,
        label: { fi: 'Asian tunnus' }
      },
      {
        predicate: Attributes.nimeke,
        label: { fi: 'Asian nimeke' }
      }
    ]
  });

  export const osoite = loader.createClass(model, {
    label: { fi: 'Osoite'  },
    properties: [
      {
        predicate: Attributes.postilokero,
        label: { fi: 'Postilokero-osoite' }
      },
      {
        predicate: Attributes.osoiteNumero,
        label: { fi: 'Osoitenumero' }
      },
      {
        predicate: Attributes.numero,
        label: { fi: 'Huoneistotunnuksen numero-osa' }
      },
      {
        predicate: Attributes.kirjainosa,
        label: { fi: 'Huoneistotunnuksen kirjainosa' }
      },
      {
        predicate: Attributes.jakokirjain,
        label: { fi: 'Huoneistotunnuksen jakokirjain' }
      },
      {
        predicate: Attributes.kadunnimi,
        label: { fi: 'Osoitteen kadunnimi' }
      }
    ]
  });

  export const yhteystieto = loader.createClass(model, {
    label: { fi: 'Yhteystieto'  },
    properties: [
      {
        predicate: Attributes.puhelinnumero,
        label:   { fi: 'Puhelinnumero' },
        comment: { fi: 'Yhteystiedoissa mainittu puhelinnumero' }
      },
      {
        predicate: Associations.osoite,
        label:   { fi: 'Osoite' },
        comment: { fi: 'Yhteystiedoissa mainittu osoite' },
        valueClass: osoite
      }
    ]
  });

  export const organisaatio = loader.createClass(model, {
    label: { fi: 'Organisaatio'  },
    equivalentClasses: ['foaf:Organisaatio'],
    properties: [
      {
        predicate: Attributes.nimi,
        label: { fi: 'Organisaation nimi' }
      },
      {
        predicate: Attributes.ytunnus,
        label:   { fi: 'Y-tunnus' },
        comment: { fi: 'Organisaation yritys tai yhteisötunnus' }
      },
      {
        predicate: Associations.yhteystiedot,
        label:   { fi: 'Yhteystieto' },
        valueClass: yhteystieto
      },
      {
        predicate: Attributes.tyyppi,
        label:   { fi: 'Organisaatiomuoto' },
        comment: { fi: 'Organisaatiomuodon kuvaava tyyppi' },
        valueClass: 'skos:Concept'
      }
    ]
  });
}
