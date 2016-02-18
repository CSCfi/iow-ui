import {
  jhsGroupId, createLibrary, createAssociation, createAttribute, assignClass,
  assignPredicate, ktkGroupId, createProfile, specializeClass, createClass
} from './entityLoader';

namespace Jhs {

  export const model = createLibrary(jhsGroupId, {
    prefix: 'jhs',
    label:   { fi: 'Julkishallinnon tietokomponentit' },
    comment: { fi: 'Julkisessa hallinnossa ja kaikilla toimialoilla yleisesti käytössä olevat tietosisällöt' },
    references: ['eos']
  });

  export namespace Associations {

    export const aidinkieli = createAssociation(model, {
      label: { fi: 'Äidinkieli' }
    });

    export const ammatti = createAssociation(model, {
      label: { fi: 'Ammatti' }
    });

    export const viittausAsiaan = createAssociation(model, {
      label: { fi: 'Viittaus asiaan' }
    });

    export const asianosainen = createAssociation(model, {
      label: { fi: 'Asianosainen' }
    });

    export const henkilo = createAssociation(model, {
      label: { fi: 'Henkilö' },
      valueClass: () => Jhs.Classes.henkilo
    });

    export const kansalaisuus = createAssociation(model, {
      label: { fi: 'Kansalaisuus' },
      valueClass: 'skos:Concept'
    });

    export const koodi = createAssociation(model, {
      id: 'koodi',
      label: { fi: 'Viittaus koodistossa rajattuun luokitukseen' },
      valueClass: 'skos:Concept'
    });

    export const organisaatio = createAssociation(model, {
      label: { fi: 'Organisaatio' }
    });

    export const osoite = createAssociation(model, {
      label: { fi: 'Osoite' }
    });

    export const siviilisaaty = createAssociation(model, {
      label: { fi: 'Siviilisääty' }
    });

    export const viittaussuhde = createAssociation(model, {
      label: { fi: 'Viittaussuhde' }
    });

    export const yhteystiedot = createAssociation(model, {
      label: { fi: 'Yhteystiedot' }
    });
  }

  export namespace Attributes {

    export const alkamisaika = createAttribute(model, {
      label: { fi: 'Alkamisaika' },
      dataType: 'xsd:dateTime'
    });

    export const alkamishetki = createAttribute(model, {
      label: { fi: 'Alkamishetki' },
      dataType: 'xsd:dateTime'
    });

    export const alkamiskuukausi = createAttribute(model, {
      label: { fi: 'Alkamiskuukausi' },
      dataType: 'xsd:dateTime'
    });

    export const alkamispaiva = createAttribute(model, {
      label: { fi: 'Alkamispäivä' },
      dataType: 'xsd:dateTime'
    });

    export const alkamispvm = createAttribute(model, {
      label: { fi: 'Alkamispäivämäärä' },
      dataType: 'xsd:dateTime'
    });

    export const alkamisvuosi = createAttribute(model, {
      label: { fi: 'Alkamisvuosi' },
      dataType: 'xsd:dateTime'
    });

    export const paattymishetki = createAttribute(model, {
      label: { fi: 'Päättymishetki' },
      dataType: 'xsd:dateTime'
    });

    export const paattymisaika = createAttribute(model, {
      label: { fi: 'Päättymisaika' },
      dataType: 'xsd:dateTime'
    });

    export const paattymiskuukausi = createAttribute(model, {
      label: { fi: 'Päättymiskuukausi' },
      dataType: 'xsd:dateTime'
    });

    export const paattymispaiva = createAttribute(model, {
      label: { fi: 'Päättymispäivä' },
      dataType: 'xsd:dateTime'
    });

    export const paattymispaivamaara = createAttribute(model, {
      label: { fi: 'Päättymispäivämäärä' },
      dataType: 'xsd:dateTime'
    });

    export const paattymisvuosi = createAttribute(model, {
      label: { fi: 'Päättymisvuosi' },
      dataType: 'xsd:dateTime'
    });

    export const aiheteksti = createAttribute(model, {
      label: { fi: 'Aiheteksti' }
    });

    export const asiatunnus = createAttribute(model, {
      label: { fi: 'Asiatunnus' }
    });

    export const asiasana = createAttribute(model, {
      label: { fi: 'Asiasana' },
      dataType: 'xsd:string'
    });

    export const etunimi = createAttribute(model, {
      label: { fi: 'Etunimi' },
      dataType: 'xsd:string'
    });

    export const henkilotunnus = createAttribute(model, {
      label: { fi: 'Henkilotunnus' },
      dataType: 'xsd:string'
    });

    export const jakokirjain = createAttribute(model, {
      label: { fi: 'Jakokirjain' },
      dataType: 'xsd:string'
    });

    export const kadunnimi = createAttribute(model, {
      label: { fi: 'Kadunnimi' },
      dataType: 'xsd:string'
    });

    export const kirjainosa = createAttribute(model, {
      label: { fi: 'Kirjainosa' }
    });

    export const korvaavuussuhdeTeksti = createAttribute(model, {
      label: { fi: 'Korvaavuussuhde teksti' }
    });

    export const kuvausteksti = createAttribute(model, {
      label: { fi: 'Kuvausteksti' },
      dataType: 'xsd:string'
    });

    export const nimeke = createAttribute(model, {
      label: { fi: 'Nimeke' },
      dataType: 'xsd:string'
    });

    export const nimi = createAttribute(model, {
      label: { fi: 'Nimi' },
      dataType: 'xsd:string'
    });

    export const numero = createAttribute(model, {
      label: { fi: 'Numero' },
      dataType: 'xsd:integer'
    });

    export const osoiteNumero = createAttribute(model, {
      label: { fi: 'Osoite numero' },
      dataType: 'xsd:integer'
    });

    export const osoiteTeksti = createAttribute(model, {
      label: { fi: 'Osoiteteksti' },
      dataType: 'xsd:string'
    });

    export const postilokero = createAttribute(model, {
      label: { fi: 'Postilokeron osoiteteksti' },
      dataType: 'xsd:string'
    });

    export const puhelinnumero = createAttribute(model, {
      label: { fi: 'Puhelinnumero' }
    });

    export const selite = createAttribute(model, {
      label: { fi: 'Selite' }
    });

    export const sukunimi = createAttribute(model, {
      label: { fi: 'Sukunimi' }
    });

    export const tehtavakoodi = createAttribute(model, {
      label: { fi: 'Tehtäväkoodi' }
    });

    export const tunniste = createAttribute(model, {
      label: { fi: 'Tunniste' }
    });

    export const tunnus = createAttribute(model, {
      label: { fi: 'Tunnus' }
    });

    export const tyyppi = createAttribute(model, {
      label: { fi: 'Tyyppi' }
    });

    export const viittaussuhdeteksti = createAttribute(model, {
      label: { fi: 'Viittaussuhdeteksti' }
    });

    export const ytunnus = createAttribute(model, {
      label: { fi: 'Y-tunnus' },
      dataType: 'xsd:string'
    });
  }

  export namespace Classes {

    export const aikavali = createClass(model, {
      label:   { fi: 'Aikaväli' },
      comment: { fi: 'Ajankohdista muodostuva ajallinen jatkumo' },
      properties: [
        {
          predicate: Jhs.Attributes.alkamishetki,
          label: { fi: 'Aikavälin alkamishetki' }
        },
        {
          predicate: Jhs.Attributes.paattymishetki,
          label: { fi: 'Aikavälin päättymishetki' }
        }
      ]
    });

    export const ajanjakso = createClass(model, {
      label: { fi: 'Ajanjakso' },
      comment: { fi: 'Nimetty aikaväli, joka voidaan määritellä eri tarkkuudella'  },
      subClassOf: aikavali,
      properties: [
        {
          predicate: Jhs.Attributes.alkamisaika,
          label: { fi: 'Ajanjakson alkamisaika' }
        },
        {
          predicate: Jhs.Attributes.alkamisvuosi,
          label: { fi: 'Ajanjakson alkamisvuosi' }
        },
        {
          predicate: Jhs.Attributes.alkamiskuukausi,
          label: { fi: 'Ajanjakson alkamiskuukausi' }
        },
        {
          predicate: Jhs.Attributes.alkamispvm,
          label: { fi: 'Ajanjakson alkamispäivämäärä' }
        },
        {
          predicate: Jhs.Attributes.alkamishetki,
          label: { fi: 'Ajanjakson alkamishetki' }
        },
        {
          predicate: Jhs.Attributes.paattymishetki,
          label: { fi: 'Ajanjakson päättymishetki' }
        },
        {
          predicate: Jhs.Attributes.paattymisaika,
          label: { fi: 'Ajanjakson päättymisaika' }
        },
        {
          predicate: Jhs.Attributes.paattymispaivamaara,
          label: { fi: 'Ajanjakson päättymispäivämäärä' }
        },
        {
          predicate: Jhs.Attributes.nimi,
          label: { fi: 'Ajanjaksolle määritelty nimi' }
        },
      ]
    });

    export const asia = createClass(model, {
      label: { fi: 'Asia' },
      comment: { fi : 'Tehtävän yksittäinen instanssi, joka käsitellään prosessin mukaisessa menettelyssä.' },
      properties: [
        {
          predicate: Jhs.Attributes.korvaavuussuhdeTeksti,
          label:   { fi: 'Asian korvaavuussuhde' },
          comment: { fi: 'Edellisen asian voimassaolo on esimerkiksi päättynyt, minkä johdosta aiempi asia on jouduttu korvaamaan uudella.' }
        },
        {
          predicate: Jhs.Attributes.tehtavakoodi,
          label:   { fi: 'Asian tehtäväkoodi' },
          comment: { fi: 'Julkisen hallinnon yhteisen tai organisaation oman tehtäväluokituksen mukainen tehtävä.' }
        },
        {
          predicate: Jhs.Attributes.aiheteksti,
          label:   { fi: 'Asian aiheteksti' },
          comment: { fi: 'Asiaan liittyvä aihe, ilmiö tai teema. Aiheella voidaan luokitella asioita erilaisiin kokonaisuuksiin tai ryhmiin. Hyödynnetään esimerkiksi raportointi- ja hakunäkymien rakentamisessa tietojärjestelmissä.' }
        },
        {
          predicate: Jhs.Attributes.asiatunnus,
          label:   { fi: 'Asiatunnus' },
          comment: { fi: 'Asiatunnus voidaan muodostaa organisaatiokohtaisesti tai organisaatioiden välillä yhteisesti sovitulla tavalla' }
        },
        {
          predicate: Jhs.Attributes.nimeke,
          label:   { fi: 'Nimeke' },
          comment: { fi: 'Asian nimitys' }
        },
        {
          predicate: Jhs.Attributes.asiasana,
          label:   { fi: 'Asian asiasana',
                     en: 'Keyword' },
          comment: { fi: 'Asian sisältöä kuvaileva tieto' }
        },
        {
          predicate: Jhs.Attributes.viittaussuhdeteksti,
          label:   { fi: 'Asian viittaussuhde' },
          comment: { fi: 'Viittaussuhdetta voi käyttää esim. osoittamaan eri asiatunnuksella esiintyviä hakemuksia, jotka ratkaistaan samalla päätöksellä.' }
        }
      ]
    });

    export const asiakirja = createClass(model, {
      label: { fi: 'Asiakirja'  }
    });

    export const henkilo = createClass(model, {
      label: { fi: 'Henkilö'  }
    });

    export const organisaatio = createClass(model, {
      label: { fi: 'Organisaatio'  }
    });

    export const osoite = createClass(model, {
      label: { fi: 'Osoite'  }
    });

    export const yhteystieto = createClass(model, {
      label: { fi: 'Yhteystieto'  }
    });
  }
}

namespace Edu {

  export const model = createLibrary(ktkGroupId, {
    prefix: 'edu',
    label:   { fi: 'Opiskelun, opetuksen ja koulutuksen tietokomponentit',
               en: 'Core Vocabulary of Education' },
    comment: { fi: 'Opiskelun, opetuksen ja koulutuksen yhteiset tietokomponentit',
               en: 'Common core data model of teaching, learning and education' },
    requires: [Jhs.model]
  });

  export namespace Attributes {
    const kuvausTeksti = assignPredicate(model, Jhs.Attributes.kuvausteksti);
  }

  export namespace Associations {
  }

  export namespace Classes {
    const organisaatio = assignClass(model, Jhs.Classes.organisaatio);
  }
}

namespace Oili {

  export const model = createProfile(ktkGroupId, {
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
    const yhteystiedot = specializeClass(model, {
      class: Jhs.Classes.yhteystieto,
      label: { fi: 'Yhteystiedot' }
    });
  }
}
