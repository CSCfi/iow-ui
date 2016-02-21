import { loader } from './exampleLoader';
import { ktkGroupId } from '../src/services/entityLoader';
import * as Jhs from './modelJHS';

const modelPrefix = 'edu';

// TODO: figure out better way to break cyclic dependencies
function breakCyclicDependency(id: string) {
  return modelPrefix + ':' + id;
}

export const model = loader.createLibrary(ktkGroupId, {
  prefix: modelPrefix,
  label:   { fi: 'Opiskelun, opetuksen ja koulutuksen tietokomponentit',
             en: 'Core Vocabulary of Education' },
  comment: { fi: 'Opiskelun, opetuksen ja koulutuksen yhteiset tietokomponentit',
             en: 'Common core data model of teaching, learning and education' },
  requires: [
    Jhs.model,
    {
      prefix: 'mlo',
      namespace: 'http://purl.org/net/mlo#',
      label: 'Metadata for learning opportunities'
    },
    {
      prefix: 'mlr-5',
      namespace: 'http://standards.iso.org/iso-iec/19788/-5/v0200#',
      label: 'Metadata for Learning Resources Part 5'
    },
    {
      prefix: 'foaf',
      namespace: 'http://xmlns.com/foaf/0.1/',
      label: 'Friend of a friend vocabulary'
    }
  ]
});

export namespace Attributes {

  export const alkamisaika = loader.createAttribute(model, {
    label: {fi: 'Alkamisaika'},
    dataType: 'xsd:time'
  });

  export const alkamishetki = loader.createAttribute(model, {
    label: { fi: 'Alkamishetki' },
    dataType: 'xsd:dateTime'
  });

  export const alkasmispaiva = loader.createAttribute(model, {
    label: { fi: 'Alkamispäivä' },
    dataType: 'xsd:date'
  });

  export const arvosteluPerusteet = loader.createAttribute(model, {
    label: { fi: 'Arvosteluperusteet' },
    dataType: 'xsd:string'
  });

  export const arvosana = loader.createAttribute(model, {
    id: 'arvo',
    label: { fi: 'Arvosana' },
    dataType: 'xsd:string'
  });


  export const avainsana = loader.createAttribute(model, {
    label: { fi: 'Avainsana' },
    dataType: 'xsd:string'
  });

  export const edellytys = loader.createAttribute(model, {
    label: { fi: 'Edellytys' },
    dataType: 'rdf:langString'
  });

  export const korkeakouluperusta = loader.createAttribute(model, {
    label: { fi: 'Korkeakouluperusta' },
    dataType: 'xsd:boolean'
  });

  export const kuvaus = loader.createAttribute(model, {
    label: { fi: 'Kuvaus' },
    dataType: 'rdf:langString'
  });

  export const laajuus = loader.createAttribute(model, {
    label: { fi: 'Laajuus' },
    dataType: 'rdf:langString'
  });

  export const laskennallinenArvosana = loader.createAttribute(model, {
    label: { fi: 'Laskennallinen arvosana' },
    dataType: 'xsd:string'
  });

  export const lisatietoTeksti = loader.createAttribute(model, {
    label: { fi: 'lisatieto teksti' },
    dataType: 'xsd:string'
  });

  export const maksimiarvo = loader.createAttribute(model, {
    label: { fi: 'Maksimiarvo' },
    dataType: 'xsd:integer'
  });

  export const maksimilaajuus = loader.createAttribute(model, {
    label: { fi: 'Maksimilaajuus' },
    dataType: 'rdf:langString'
  });

  export const minimiarvo = loader.createAttribute(model, {
    label: { fi: 'Minimiarvo' },
    dataType: 'xsd:integer'
  });

  export const minimilaajuus = loader.createAttribute(model, {
    label: { fi: 'Minimilaajuus' },
    dataType: 'rdf:langString'
  });

  export const nimi = loader.createAttribute(model, {
    label: { fi: 'Nimi' },
    dataType: 'rdf:langString'
  });

  export const lyhenne = loader.createAttribute(model, {
    label: { fi: 'Lyhenne' },
    dataType: 'xsd:string'
  });

  export const opiskelijanumero = loader.createAttribute(model, {
    label: { fi: 'opiskelijanumero' },
    dataType: 'xsd:string',
    subPropertyOf: 'dc:identifier'
  });

  export const paattymisaika = loader.createAttribute(model, {
    label: { fi: 'Päättymisaika' },
    dataType: 'xsd:time'
  });

  export const paattymishetki = loader.createAttribute(model, {
    label: { fi: 'Päättymishetki' },
    dataType: 'xsd:dateTime'
  });

  export const paattymispaiva = loader.createAttribute(model, {
    label: { fi: 'Päättymispäivä' },
    dataType: 'xsd:date'
  });

  export const perustelu = loader.createAttribute(model, {
    label: { fi: 'Perustelu' },
    dataType: 'rdf:langString'
  });

  export const prioriteetti = loader.createAttribute(model, {
    label: { fi: 'Prioriteetti' }
  });

  export const selite = loader.createAttribute(model, {
    label: { fi: 'Selite' },
    dataType: 'rdf:langString'
  });

  export const tavoite = loader.createAttribute(model, {
    label: { fi: 'Tavoite' },
    dataType: 'rdf:langString'
  });

  export const tunniste = loader.createAttribute(model, {
    label: { fi: 'Tunniste' },
    dataType: 'xsd:string'
  });

  export const verkkosivu = loader.createAttribute(model, {
    label: { fi: 'Verkkosivu' },
    dataType: 'xsd:anyURI'
  });

  loader.assignPredicate(model, Jhs.Attributes.etunimi);
  loader.assignPredicate(model, Jhs.Attributes.henkilotunnus);
  loader.assignPredicate(model, Jhs.Attributes.jakokirjain);
  loader.assignPredicate(model, Jhs.Attributes.kadunnimi);
  loader.assignPredicate(model, Jhs.Attributes.kirjainosa);
  loader.assignPredicate(model, Jhs.Attributes.kuvausteksti);
  loader.assignPredicate(model, Jhs.Attributes.nimi);
  loader.assignPredicate(model, Jhs.Attributes.numero);
  loader.assignPredicate(model, Jhs.Attributes.postilokero);
  loader.assignPredicate(model, Jhs.Attributes.sukunimi);
  loader.assignPredicate(model, Jhs.Attributes.tunniste);
  loader.assignPredicate(model, Jhs.Attributes.tyyppi);
  loader.assignPredicate(model, Jhs.Attributes.ytunnus);
}

export namespace Associations {

  export const ajanjakso = loader.createAssociation(model, {
    id: 'ajanjakso',
    label: { fi: 'Ajanjakso' }
  });

  export const ajankohta = loader.createAssociation(model, {
    label: { fi: 'Ajankohta' }
  });

  export const arvoalue = loader.createAssociation(model, {
    label: { fi: 'Arvoalue' },
    valueClass: 'skos:Concept'
  });

  export const arvosana = loader.createAssociation(model, {
    id: 'arvosana',
    label: { fi: 'Arvosana' },
    valueClass: () => Classes.arvosana
  });

  export const hakijaryhma = loader.createAssociation(model, {
    label: { fi: 'Hakijaryhmä' }
  });

  export const haku = loader.createAssociation(model, {
    id: 'haku',
    label: { fi: 'Kohteena oleva koulutukseen tähtäävä haku' }
  });

  export const hakukohde = loader.createAssociation(model, {
    label:   { fi: 'Hakukohde' },
    comment: { fi: 'Asiaan liittyvä hakukohde' }
  });

  export const harjoittelukohde = loader.createAssociation(model, {
    label: { fi: 'Harjoittelukoulu' }
  });

  export const ilmoittautuja = loader.createAssociation(model, {
    label: { fi: 'Ilmoittautuja' }
  });

  export const ilmoittautumisenKohde = loader.createAssociation(model, {
    label: { fi: 'Ilmoittautumisen kohde' }
  });

  export const ilmoittautumisenTila = loader.createAssociation(model, {
    label: { fi: 'Ilmoittautumisen tila' }
  });

  export const kiintio = loader.createAssociation(model, {
    label: { fi: 'Kiintio' }
  });

  export const koodi = loader.createAssociation(model, {
    label: { fi: 'Koodi' },
    valueClass: 'skos:Concept'
  });

  export const opintojakso = loader.createAssociation(model, {
    label: { fi: 'Opintojakso' }
  });

  export const opintokokonaisuus = loader.createAssociation(model, {
    label: { fi: 'Opintokokonaisuus' }
  });

  export const tilakoodi = loader.createAssociation(model, {
    label: { fi: 'Tilakoodi' }
  });

  export const tyyppi = loader.createAssociation(model, {
    label: { fi: 'Tyyppi' }
  });

  export const voimassaoloaika = loader.createAssociation(model, {
    label:   { fi: 'Voimassaolo' },
    comment: { fi: 'Voimassaolo aika' },
    valueClass: () => Classes.ajanjakso
  });

  export const valintatapa = loader.createAssociation(model, {
    label:   { fi: 'Valintatapa' },
    comment: { fi: 'Valintatapa' },
    valueClass: () => Classes.valintatapa
  });

  loader.assignPredicate(model, Jhs.Associations.ammatti);
  loader.assignPredicate(model, Jhs.Associations.aidinkieli);
  loader.assignPredicate(model, Jhs.Associations.kansalaisuus);
  loader.assignPredicate(model, Jhs.Associations.koodi);
  loader.assignPredicate(model, Jhs.Associations.siviilisaaty);
  loader.assignPredicate(model, Jhs.Associations.yhteystiedot);
}

export namespace Classes {

  const opintokokonaisuusId = 'Opintokokonaisuus';

  export const ajanjakso = loader.createClass(model, {
    label: { en: 'Period',
      fi: 'Ajanjakso'
    },
    comment: { fi: 'Aikamääreistä koostuva ajallisen ilmiön kuvaus' },
    subClassOf: Jhs.Classes.ajanjakso,
    properties: [
      {
        predicate: Attributes.paattymisaika,
        label:   { fi: 'Päättymisaika' },
        comment: { fi: 'Ajanjakson päättymisaika' },
      },
      {
        predicate: Attributes.alkamishetki,
        label:   { fi: 'Ajanjakson alkamishetki' },
        comment: { fi: 'Ajanjakson alkamishetki' },
      },
      {
        predicate: Attributes.alkamisaika,
        label:   { en: 'Starting time of the period',
                   fi: 'Ajanjakson alkamisaika'
        },
        comment: { en: 'Point in time when the period starts',
                   fi: 'Ajankohta jolloin ajanjakso katsotaan alkaneeksi'
        }
      },
      {
        predicate: Attributes.paattymispaiva,
        label:   { fi: 'Ajanjakson päättymispäivä' },
        comment: { fi: 'Ajanjakson päättymispäivä' },
      },
      {
        predicate: Attributes.nimi,
        label:   { fi: 'Ajanjakson nimi' },
        comment: { fi: 'Ajanjaksolle annettu nimi' },
      },
      {
        predicate: Attributes.lyhenne,
        label:   { fi: 'Ajanjakson lyhenne' },
        comment: { fi: 'Ajanjaksolle määritelty lyhenne' },
      },
      {
        predicate: Associations.koodi,
        label:   { fi: 'Ajanjakson koodi' },
        comment: { fi: 'Ajanjakson luokitteleva arvo' },
      },
      {
        predicate: Attributes.kuvaus,
        label:   { fi: 'Ajanjakson kuvaus' },
        comment: { fi: 'Ajanjaksoa kuvaileva teksti' },
      },
      {
        predicate: Attributes.paattymishetki,
        label:   { fi: 'Ajanjakson päättymishetki' },
        comment: { fi: 'Ajanjakson päättymishetki' },
      }
    ]
  });

  export const koulutuksenKuvaus = loader.createClass(model, {
    label: { fi: 'Koulutuksen kuvaus' },
    equivalentClasses: ['http://purl.org/net/mlo#LearningOpportunity']
  });

  export const opintojakso = loader.createClass(model, {
    concept: 'http://www.yso.fi/onto/koko/p70433',
    label:   { fi: 'Opintojakso',
      en: 'Study module'
    },
    comment: { fi: 'tiettyä aihetta, sisältöä tai osaamisen alaa käsittelevä, erikseen suoritettavissa oleva opintojen osa' },
    subClassOf: koulutuksenKuvaus,
    properties: [
      {
        predicate: Attributes.maksimilaajuus,
        label:   { fi: 'Opintojakson maksimilaajuus' },
        comment: { fi: 'Suurin opintopistemäärä jonka opintojaksosta voi suorittaa.' },
        dataType: 'xsd:string'
      },
      {
        predicate: Attributes.kuvaus,
        label:   { fi: 'Opintojakson sisältö' },
        comment: { fi: 'Opintojakson sisällön kuvaus' },
        dataType: 'xsd:string'
      },
      {
        predicate: Attributes.tunniste,
        label: { fi: 'Opintojakson yksilöivä tunnistetieto' }
      },
      {
        predicate: Attributes.tavoite,
        label:   { fi: 'Opintojakson tavoite' },
        comment: { fi: 'Opintojakson tavoitteiden kuvaus' },
        dataType: 'xsd:string'
      },
      {
        predicate: Attributes.arvosteluPerusteet,
        label:   { fi: 'Opintojakson arvosteluperusteet' },
        comment: { fi: 'Opintojakson arvosteluperusteiden kuvaus' }
      },
      {
        predicate: Attributes.laajuus,
        label:   { fi: 'Opintojakson laajuus' },
        comment: { fi: 'Opintojakson laajuus opintopisteinä' },
        dataType: 'xsd:string',
      },
      {
        predicate: Attributes.minimilaajuus,
        label:   { fi: 'Opintojakson minimilaajuus' },
        comment: { fi: 'Pienin opintopistemäärä jolla opintojakson voi suorittaa.' },
        dataType: 'xsd:string'
      },
      {
        predicate: Associations.koodi,
        label:   { fi: 'Opintojakson koodi' },
        comment: { fi: 'Opintojakson yksilöivä tunnistetieto' },
        valueClass: 'skos:Concept'
      },
      {
        predicate: Attributes.nimi,
        label:   { fi: 'Opintojakson nimi' },
        comment: { fi: 'Opintojakson nimi' },
        dataType: 'xsd:string'
      },
      {
        predicate: Associations.opintokokonaisuus,
        label:   { fi: 'Opintokokonaisuus' },
        comment: { fi: 'Opintokokonaisuus, johon opintojakso sisältyy' },
        valueClass: breakCyclicDependency(opintokokonaisuusId)
      },
      {
        predicate: Attributes.lisatietoTeksti,
        label:   { fi: 'Opintojakson lisätiedot' },
        comment: { fi: 'Opintojaksolle määritellyt lisätiedot' }
      },
      {
        predicate: Associations.ajanjakso,
        label:   { fi: 'Opintojakson ajanjakso' },
        comment: { fi: 'Ajanjakso, jolloin opintojakson kuvaus on voimassa' },
        valueClass: ajanjakso
      }
    ]
  });

  export const opintokokonaisuus = loader.createClass(model, {
    id: opintokokonaisuusId,
    label:   { en: 'Study scheme',
      fi: 'Opintokokonaisuus'
    },
    comment: { fi: 'opintojen osa, joka muodostuu kahdesta tai useammasta yhtä aihepiiriä tai ongelma-aluetta käsittelevästä tai jonkin tieteenalan perusteet muodostavasta opintojaksosta' },
    subClassOf: koulutuksenKuvaus,
    properties: [
      {
        predicate: Attributes.minimilaajuus,
        label:   { fi: 'Opintokokonaisuuden minimilaajuus' },
        comment: { fi: 'Laajuus opintopisteinä, jonka kokonaisena kokonaisuus tulee vähintään suorittaa' },
        dataType: 'xsd:string'
      },
      {
        predicate: Attributes.arvosteluPerusteet,
        label:   { fi: 'Arvosteluperuste' },
        comment: { fi: 'Opintokokonaisuutta kuvaavat avainsanat' }
      },
      {
        predicate: Attributes.kuvaus,
        label:   { fi: 'Opintojakson kuvaus' },
        comment: { fi: 'Opintokokonaisuuden kuvaus' },
        dataType: 'xsd:string'
      },
      {
        predicate: Attributes.tunniste,
        label:   { fi: 'Opintokokonaisuuden tunniste' },
        comment: { fi: 'Opintokokonaisuudelle määritelty tunniste' },
        dataType: 'xsd:string'
      },
      {
        predicate: Attributes.nimi,
        label:   { fi: 'Opintokokonaisuuden nimi' },
        comment: { fi: 'Opintokokonaisuuden nimi' },
        dataType: 'xsd:string'
      },
      {
        predicate: Attributes.maksimilaajuus,
        label:   { fi: 'Opintokokonaisuuden maksimilaajuus' },
        comment: { fi: 'Opintokokonaisuuden laajuus opintopisteinä, jonka laajuisena kokonaisuuden voi maksimisaan suorittaa' },
        dataType: 'xsd:string'
      },
      {
        predicate: Attributes.lisatietoTeksti,
        label:   { fi: 'Lisätiedot' },
        comment: { fi: 'Lisätietoja opintokokonaisuudesta' }
      },
      {
        predicate: Attributes.tavoite,
        label:   { fi: 'Opintojakson tavoitteet' },
        comment: { fi: 'Kuvaus opintokokonaisuuden tavoitteista' },
        dataType: 'xsd:string'
      },
      {
        predicate: Attributes.avainsana,
        label:   { fi: 'Opintojakson avainsana' },
        comment: { fi: 'Opintokokonaisuutta kuvaavat avainsanat' }
      },
      {
        predicate: Attributes.verkkosivu,
        label:   { fi: 'Opintokokonaisuuden verkkosivu' },
        comment: { fi: 'Opintokokonaisuutta kuvaava sivusto' }
      },
      {
        predicate: Associations.opintojakso,
        label:   { fi: 'Opintojakso' },
        comment: { fi: 'Opintokokonaisuuteen kuuluvat opintojaksot' },
        valueClass: opintojakso
      },
      {
        predicate: Attributes.laajuus,
        label:   { fi: 'Opintokokonaisuuden laajuus' },
        comment: { fi: 'Opintokokonaisuuden laajuus' },
        dataType: 'xsd:string'
      }
    ]
  });

  export const arvosana = loader.createClass(model, {
    concept: 'http://www.yso.fi/onto/koko/p17136',
    label:   { en: 'Grade',
               fi: 'Arvosana' },
    comment: { fi: 'arvioinnin tuloksena oppilaalle, opiskelijalle tai tutkinnon suorittajalle annettava, järjestetystä joukosta valittava numeerinen tai sanallinen ilmaus' },
    properties: [
      {
        predicate: Associations.koodi,
        label:   { fi: 'Arvosanan koodi' },
        comment: { fi: 'Arvosanan yksilöivä tunnistetieto' },
        valueClass: 'skos:Concept'
      },
      {
        predicate: Attributes.nimi,
        label:   { fi: 'Arvosanan nimi' },
        comment: { en: 'Name of the grade',
                   fi: 'Arvosanalle annettu nimi' },
        dataType: 'xsd:string'
      },
      {
        predicate: Attributes.arvosana,
        label:   { fi: 'Arvosana' },
        comment: { fi: 'Arvosana-asteikon yksittäinen arvo' }
      }
    ]
  });

  export const arvostelu = loader.createClass(model, {
    label:   { en: 'Grading',
               fi: 'Arvostelu' },
    comment: { fi: 'oppilaan, opiskelijan tai tutkinnon suorittajan oppimisen, osaamisen tai oppimistulosten arvon määrittäminen' },
    properties: [
      {
        predicate: Attributes.selite,
        label:   { fi: 'Arvostelun selite' },
        comment: { fi: 'arvostelun selite' },
        dataType: 'xsd:string',
      },
      {
        predicate: Associations.arvosana,
        label:   { fi: 'Arvostelun arvosana' },
        comment: { fi: 'Arvostelussa määritelty arvosana' },
        valueClass: arvosana
      },
      {
        predicate: Attributes.nimi,
        label:   { fi: 'Arvostelun nimi' },
        comment: { fi: 'Arvostelulle annettu nimi' },
        dataType: 'xsd:string'
      },
      {
        predicate: Associations.opintokokonaisuus,
        comment: { fi: 'Arvosteltu opintokokonaisuus' },
        label:   { fi: 'Arvosteltu opintokokonaisuus' },
        valueClass: opintokokonaisuus
      }
    ]
  });

  export const asteikko = loader.createClass(model, {
    label:   { fi: 'Asteikko' },
    comment: { fi: 'Arvosteluasteikko, joka määrittää arvosanojen keskinäisen järjestyksen ja suhteet' },
    properties: [
      {
        predicate: Attributes.nimi,
        label:   { fi: 'Arvosteluasteikon nimi' },
        comment: { fi: 'Asteikosta yleiskielessä käytettävä nimitys' },
        dataType: 'xsd:string'
      },
      {
        predicate: Attributes.tunniste,
        label:   { fi: 'Asteikon tunniste' },
        comment: { fi: 'Asteikon yksilöivä tunnistetieto' }
      },
      {
        predicate: Attributes.minimiarvo,
        label:   { fi: 'Asteikon minimiarvo' },
        comment: { fi: 'Asteikon minimiarvo' }
      },
      {
        predicate: Attributes.maksimiarvo,
        label:   { fi: 'Asteikon maksimiarvo' },
        comment: { fi: 'Asteikon maksimiarvo' }
      },
      {
        predicate: Attributes.selite,
        label:   { fi: 'Asteikon selite' },
        comment: { fi: 'Asteikon käyttöä kuvaava selite' },
        dataType: 'xsd:string',
      },
      {
        predicate: Associations.arvoalue,
        label:   { fi: 'Asteikon arvoalue' },
        comment: { fi: 'Asteikolle määritelty luokitus' },
        valueClass: 'skos:Concept'
      }
    ]
  });

  export const haku = loader.createClass(model, {
    label:   { fi: 'Haku' },
    comment: { fi: 'Haku ilmaisee mikä hakutapa ja hakutyyppi on kyseessä ja milloin haku kyseinen haku järjestetään.' },
    properties: [
      {
        predicate: Attributes.nimi,
        label:   { fi: 'Haun nimi' },
        comment: { fi: 'Haulle määritelty nimi' },
        example: 'Syyshaku 2015',
        dataType: 'xsd:string',
      },
      {
        predicate: Associations.koodi,
        label:   { fi: 'Haun koodi' },
        comment: { fi: 'Haulle määritelty koodi' },
        valueClass: 'skos:Concept'
      }
    ]
  });

  export const kohderyhma = loader.createClass(model, {
    label:   { fi: 'Kohderyhma' },
    comment: { fi: 'kuvaus tiettyä tarkoitusta varten rajatusta joukosta' },
    properties: [
      {
        predicate: Attributes.kuvaus,
        label: { fi: 'Kohderyhmän kuvaus' },
        dataType: 'xsd:string'
      },
      {
        predicate: Attributes.nimi,
        label:   { fi: 'Kohderyhmän nimi' },
        comment: { fi: 'kohderyhmän nimi' },
        dataType: 'xsd:string'
      },
      {
        predicate: Associations.kiintio,
        label:   { fi: 'Kohderyhmän kiintiö' },
        comment: { fi: 'Kohderyhmälle määritellyt rajoitukset' },
        valueClass: 'http://iow.csc.fi/ns/edu#Valintakiintio'
      }
    ]
  });

  export const valintatapa = loader.createClass(model, {
    label: { fi: 'Valintatapa' },
    properties: [
      {
        predicate: Attributes.kuvaus,
        label:   { fi: 'Valintatavan kuvaus' },
        comment: { fi: 'Valintatavasta yleiskielessä käytettävä selite' },
        dataType: 'xsd:string'
      },
      {
        predicate: Associations.koodi,
        label:   { fi: 'koodi' },
        comment: { fi: 'Valintatavan luokituksen mukaisesti yksilöivä tunnistetieto.' },
        valueClass: 'skos:Concept'
      },
      {
        predicate: Attributes.nimi,
        label:   { fi: 'Valintatavan nimi' },
        comment: { fi: 'Tieto, joka ilmaisee mitä valintaperustetta käytetään hakijan hyväksymisessä koulutukseen.' },
        dataType: 'xsd:string'
      }
    ]
  });

  export const hakukohde = loader.createClass(model, {
    label:   { fi: 'Hakukohde' },
    comment: { fi: 'koulutuksen toteutus, joka on liitetty tiettyyn hakuun' },
    properties: [
      {
        predicate: Associations.hakijaryhma,
        comment: { fi: 'Koulutuksen järjestäjän määrittämät kriteerit täyttävä hakijoiden joukko' },
        label: { fi: 'Hakukohteen hakijaryhmä' },
        valueClass: kohderyhma
      },
      {
        predicate: Associations.valintatapa,
        label:   { fi: 'Valintatapa' },
        comment: { fi: 'Hakukohteeseen valittavien valintatapa' },
        valueClass: valintatapa,
      },
      {
        predicate: Attributes.tunniste,
        label:   { fi: 'Hakukohteen tunniste' },
        comment: { fi: 'Hakukohteen tunniste' }
      },
      {
        predicate: Associations.haku,
        label:   { fi: 'Haku' },
        comment: { fi: 'Haku, jossa hakukohde on mukana' },
        valueClass: haku,
      },
      {
        predicate: Attributes.nimi,
        label:   { fi: 'Hakukohteen nimi' },
        comment: { fi: 'Haettavan koulutuksen nimi' },
        dataType: 'xsd:string',
      }
    ]
  });

  export const hakutoive = loader.createClass(model, {
    label: { fi: 'Hakutoive' },
    properties: [
      {
        predicate: Attributes.prioriteetti,
        label:   { fi: 'Prioriteetti' },
        comment: { fi: 'Hakukohteelle määritelty prioriteetti' },
        dataType: 'xsd:integer',
      },
      {
        predicate: Associations.hakukohde,
        label:   { fi: 'Hakutoiveen kohde' },
        comment: { fi: 'Hakukohde, jonne henkilö hakee' },
        valueClass: hakukohde
      }
    ]
  });

  export const hallintoalue = loader.createClass(model, {
    label:   { fi: 'Hallintoalue' },
    comment: { fi: 'yhteiskunnallisten toimintojen organisointia varten määritetty alue' },
    properties: [
      {
        predicate: Associations.tyyppi,
        label: { fi: 'Hallintoalueen tyyppi' },
        valueClass: 'skos:Concept'
      },
      {
        predicate: Attributes.tunniste,
        label: { fi: 'Hallintoalueen tunniste' },
        dataType: 'xsd:string'
      },
      {
        predicate: Attributes.nimi,
        label: { fi: 'Hallintoalueen nimi' },
        dataType: 'xsd:string'
      },
      {
        predicate: Associations.voimassaoloaika,
        label:   { fi: 'Hallintoalueen voimassaolo' },
        comment: { fi: 'Hallintoalueen voimassaoloaika' },
        valueClass: ajanjakso
      },
      {
        predicate: Attributes.lyhenne,
        label:   { fi: 'Lyhenne' },
        comment: { fi: 'Hallintoalueen nimen lyhenne' }
      }
    ]
  });

  export const harjoittelijavaihto = loader.createClass(model, {
    label:   { fi: 'Harjoittelijavaihto' },
    comment: { fi: 'Opiskelijan suorittama opintoihin liittyvä työharjoittelu korkeakoulun ulkopuolella.' },
    properties: [
      {
        predicate: Attributes.nimi,
        label:   { fi: 'Harjoitelijavaihdon nimi' },
        comment: { fi: 'Harjoitteluvaihdolle määritelty nimi' },
        dataType: 'xsd:string'
      },
      {
        predicate: Attributes.kuvaus,
        label:   { fi: 'Harjoittelijavaihdon selite' },
        comment: { fi: 'Harjoittelijavaihdon kuvausteksti' },
        dataType: 'xsd:string'
      }
    ]
  });

  export const ilmoittautuminen = loader.createClass(model, {
    label: { fi: 'Ilmoittautuminen',
             en: 'Enrollment' }
  });

  export const ilmoittautumisenTila = loader.createClass(model, {
    label: { fi: 'Ilmoittautumisen tila' }
  });

  export const koulutuksenToteutus = loader.createClass(model, {
    label: { fi: 'Koulutuksen toteutus' },
    equivalentClasses: ['http://purl.org/net/mlo#LearningOpportunityInstance']
  });

  export const koulutustoimija = loader.createClass(model, {
    label: { fi: 'Koulutustoimija' },
    subClassOf: Jhs.Classes.organisaatio,
    properties: [
      {
        predicate: Jhs.Attributes.ytunnus,
        label: { fi: 'Organisaation Y-tunnus' }
      },
      {
        predicate: Associations.ajanjakso,
        label: { fi: 'Koulutustoimijan voimassaolo' }
      },
      {
        predicate: Attributes.nimi,
        label: { fi: 'Koulutustoimijan nimi' },
        dataType: 'xsd:string'
      },
      {
        predicate: Jhs.Associations.organisaatio,
        label: { fi: 'Koulutustoimijan alaorganisaatio' },
        valueClass: 'skos:Concept'
      },
      {
        predicate: Attributes.korkeakouluperusta,
        label:   { fi: 'Korkeakoululähtöinen yritys' },
        comment: { fi: 'Organisaation korkeakoulukytkentä' }
      }
    ]
  });

  export const opiskelija = loader.createClass(model, {
    label: { fi: 'Opiskelija' },
    subClassOf: Jhs.Classes.henkilo,
    equivalentClasses: ['http://standards.iso.org/iso-iec/19788/-5/v0200#t200'],
    properties: [
      {
        predicate: Jhs.Attributes.sukunimi,
        label:   { fi: 'Sukunimi' },
        comment: { fi: 'Opiskelijan sukunimi' }
      },
      {
        predicate: Jhs.Attributes.etunimi,
        label:   { fi: 'Etunimi'},
        comment: { fi: 'Opiskelijan etunimi' }
      }
    ]
  });

  export const valintakiintio = loader.createClass(model, {
    label:   { fi: 'Valintakiintiö' },
    comment: { fi: 'Tietyin perustein hakijaryhmälle määritelty kiintiö aloituspaikkoja' },
    properties: [
      {
        predicate: Attributes.nimi,
        label: { fi: 'nimi' },
        dataType: 'xsd:string'
      },
      {
        predicate: Associations.koodi,
        label: { fi: 'Valintakiintiön koodi' },
        valueClass: 'skos:Concept'
      }
    ]
  });


  loader.assignClass(model, Jhs.Classes.henkilo);
  loader.assignClass(model, Jhs.Classes.organisaatio);
  loader.assignClass(model, Jhs.Classes.osoite);
}

