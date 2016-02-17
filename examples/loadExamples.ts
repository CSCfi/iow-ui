import IPromise = angular.IPromise;
import { httpService } from './requestToAngularHttpService';
import {
  EntityDeserializer, Localizable, Uri, Type, Model, Predicate, Attribute,
  Association, Class, Property
} from '../src/services/entities';
import { ModelService } from '../src/services/modelService';
import { ClassService } from '../src/services/classService';
import { PredicateService } from '../src/services/predicateService';
import { UserService } from '../src/services/userService';
import { config } from '../src/config';

var http = require('http');
var fs = require('fs');
var path = require('path');

var argv = require('optimist')
  .default({
    host: 'localhost',
    port: 8084
  })
  .argv;


process.env['API_ENDPOINT'] = `http://${argv.host}:${argv.port}/api`;

const logFn: angular.ILogCall = (...args: any[]) => console.log(args);

const log: angular.ILogService = {
  debug: logFn,
  error: logFn,
  info: logFn,
  log: logFn,
  warn: logFn
};

const q: angular.IQService = require('q');
const entityDeserializer = new EntityDeserializer(log);
const modelService = new ModelService(httpService, q, entityDeserializer);
const predicateService = new PredicateService(httpService, entityDeserializer);
const classService = new ClassService(httpService, q, predicateService, entityDeserializer);
const userService = new UserService(httpService, entityDeserializer);

function makeRawRequest(requestPath: any, fileName: string): Promise<any> {
  function logger(res: any) {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
  }

  function reqOpts(path: any, type: any) {
    return {
      host: argv.host,
      port: argv.port,
      path: path,
      method: type,
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }

  return new Promise((resolve) => {
    const req = http.request(reqOpts(requestPath, "PUT"), (res: any) => {
      logger(res);
      resolve(res);
    });
    req.write(fs.readFileSync(path.join(__dirname, fileName)));
    req.end();
  });
}

const ktkGroupId = 'https://tt.eduuni.fi/sites/csc-iow#KTK';
const jhsGroupId = 'https://tt.eduuni.fi/sites/csc-iow#JHS';
const asiaConceptId = 'http://jhsmeta.fi/skos/J392';

const loggedIn = ensureLoggedIn();
const groupsDone = loggedIn.then(() => makeRawRequest('/api/rest/groups', 'exampleGroups.json'));

function ensureLoggedIn(): IPromise<any> {
  return userService.updateLogin()
    .then<any>(user => !user.isLoggedIn() ? httpService.get(config.apiEndpoint + '/login').then(() => userService.updateLogin()) : q.when());
}

function nop(response: any) {
}

interface EntityDetails {
  label: Localizable;
  comment?: Localizable;
}

interface ClassDetails extends EntityDetails {
  properties?: [IPromise<Predicate>, EntityDetails][]
}

function setDetails(entity: { label: Localizable, comment: Localizable }, details: EntityDetails) {
  entity.label = details.label;
  entity.comment = details.comment;
}

function createModel(prefix: string, groupId: Uri, type: Type, details: EntityDetails): IPromise<Model> {

  const modelIdNamespace = 'http://iow.csc.fi/' + (type === 'library' ? 'ns'  : 'ap') + '/';

  return groupsDone
    .then(() => modelService.deleteModel(modelIdNamespace + prefix))
    .then(nop, nop)
    .then(() => modelService.newModel(prefix, details.label['fi'], groupId, 'fi', type))
    .then(model => {
      setDetails(model, details);
      return modelService.createModel(model).then(() => model);
    });
}

function createLibrary(prefix: string, groupId: Uri, details: EntityDetails): IPromise<Model> {
  return createModel(prefix, groupId, 'library', details);
}

function createProfile(prefix: string, groupId: Uri, details: EntityDetails): IPromise<Model> {
  return createModel(prefix, groupId, 'profile', details);
}

function createClass(modelPromise: IPromise<Model>, details: ClassDetails): IPromise<Class> {
  return modelPromise
    .then(model => classService.newClass(model, details.label['fi'], asiaConceptId, 'fi'))
    .then(klass => {
      setDetails(klass, details);

      const propertyPromises: IPromise<any>[] = [];

        for (const [predicatePromise, propertyDetails] of details.properties || []) {
          propertyPromises.push(createProperty(predicatePromise, propertyDetails).then(property => {
            klass.addProperty(property);
          }));
        }

        return q.all(propertyPromises)
          .then(() => classService.createClass(klass)).then(() => klass);
    });
}

function createPredicate<T extends Predicate>(modelPromise: IPromise<Model>, type: Type, details: EntityDetails): IPromise<T> {
  return modelPromise
    .then(model => predicateService.newPredicate(model, details.label['fi'], asiaConceptId, type, 'fi'))
    .then(predicate => {
      setDetails(predicate, details);
      return predicateService.createPredicate(predicate).then(() => predicate);
    });
}

function createAttribute(modelPromise: IPromise<Model>, dataType: string, details: EntityDetails): IPromise<Attribute> {
  return createPredicate<Attribute>(modelPromise, 'attribute', details)
    .then(attribute => {
      attribute.dataType = dataType;
      return attribute;
    })
}

function createAssociation(modelPromise: IPromise<Model>, valueClass: Uri, details: EntityDetails): IPromise<Association> {
  return createPredicate<Association>(modelPromise, 'association', details)
    .then(association => {
      association.valueClass = valueClass;
      return association;
    })
}

function createProperty(predicatePromise: IPromise<Predicate>, details: EntityDetails): IPromise<Property> {
  return predicatePromise
    .then(p => classService.newProperty(p.id))
    .then(p => {
      setDetails(p, details);
      return p;
    })
}

namespace Jhs {

  export const model = createLibrary('jhs', jhsGroupId, {
    label:   { fi: 'Julkishallinnon tietokomponentit' },
    comment: { fi: 'Julkisessa hallinnossa ja kaikilla toimialoilla yleisesti käytössä olevat tietosisällöt' }
  });

  export namespace Associations {

    export const aidinkieli = createAssociation(model, null, { label: { fi: 'Äidinkieli' } });
    export const ammatti = createAssociation(model, null, { label: { fi: 'Ammatti' } });
    export const viittausAsiaan = createAssociation(model, null, { label: { fi: 'Viittaus asiaan' } });
    export const asianosainen = createAssociation(model, null, { label: { fi: 'Asianosainen' } });
    export const henkilo = createAssociation(model, 'jhs:Henkilö', { label: { fi: 'Henkilö' } });
    export const kansalaisuus = createAssociation(model, 'skos:Concept', { label: { fi: 'Kansalaisuus' } });
    export const koodi = createAssociation(model, 'skos:Concept', { label: { fi: 'Viittaus koodistossa rajattuun luokitukseen' } });
    export const organisaatio = createAssociation(model, null, { label: { fi: 'Organisaatio' } });
    export const osoite = createAssociation(model, null, { label: { fi: 'Osoite' } });
    export const siviilisaaty = createAssociation(model, null, { label: { fi: 'Siviilisääty' } });
    export const viittaussuhde = createAssociation(model, null, { label: { fi: 'Viittaussuhde' } });
    export const yhteystiedot = createAssociation(model, null, { label: { fi: 'Yhteystiedot' } });
  }

  export namespace Attributes {

    export const alkamisaika = createAttribute(model, 'xsd:dateTime', { label: { fi: 'Alkamisaika' } });
    export const alkamishetki = createAttribute(model, 'xsd:dateTime', { label: { fi: 'Alkamishetki' } });
    export const alkamiskuukausi = createAttribute(model, 'xsd:dateTime', { label: { fi: 'Alkamiskuukausi' } });
    export const alkamispaiva = createAttribute(model, 'xsd:dateTime', { label: { fi: 'Alkamispäivä' } });
    export const alkamispvm = createAttribute(model, 'xsd:dateTime', { label: { fi: 'Alkamispäivämäärä' } });
    export const alkamisvuosi = createAttribute(model, 'xsd:dateTime', { label: { fi: 'Alkamisvuosi' } });
    export const paattymishetki = createAttribute(model, 'xsd:dateTime', { label: { fi: 'Päättymishetki' } });
    export const paattymisaika = createAttribute(model, 'xsd:dateTime', { label: { fi: 'Päättymisaika' } });
    export const paattymiskuukausi = createAttribute(model, 'xsd:dateTime', { label: { fi: 'Päättymiskuukausi' } });
    export const paattymispaiva = createAttribute(model, 'xsd:dateTime', { label: { fi: 'Päättymispäivä' } });
    export const paattymispaivamaara = createAttribute(model, 'xsd:dateTime', { label: { fi: 'Päättymispäivämäärä' } });
    export const paattymisvuosi = createAttribute(model, 'xsd:dateTime', { label: { fi: 'Päättymisvuosi' } });
    export const aiheteksti = createAttribute(model, null, { label: { fi: 'Aiheteksti' } });
    export const asiatunnus = createAttribute(model, null, { label: { fi: 'Asiatunnus' } });
    export const asiasana = createAttribute(model, 'xsd:string', { label: { fi: 'Asiasana' } });
    export const etunimi = createAttribute(model, 'xsd:string', { label: { fi: 'Etunimi' } });
    export const henkilotunnus = createAttribute(model, 'xsd:string', { label: { fi: 'Henkilotunnus' } });
    export const jakokirjain = createAttribute(model, 'xsd:string', { label: { fi: 'Jakokirjain' } });
    export const kadunnimi = createAttribute(model, 'xsd:string', { label: { fi: 'Kadunnimi' } });
    export const kirjainosa = createAttribute(model, null, { label: { fi: 'Kirjainosa' } });
    export const korvaavuussuhdeTeksti = createAttribute(model, null, { label: { fi: 'Korvaavuussuhde teksti' } });
    export const kuvausteksti = createAttribute(model, 'xsd:string', { label: { fi: 'Kuvausteksti' } });
    export const nimeke = createAttribute(model, 'xsd:string', { label: { fi: 'Nimeke' } });
    export const nimi = createAttribute(model, 'xsd:string', { label: { fi: 'Nimi' } });
    export const numero = createAttribute(model, 'xsd:integer', { label: { fi: 'Numero' } });
    export const osoiteNumero = createAttribute(model, 'xsd:integer', { label: { fi: 'Osoite numero' } });
    export const osoiteTeksti = createAttribute(model, 'xsd:string', { label: { fi: 'Osoiteteksti' } });
    export const postilokero = createAttribute(model, 'xsd:string', { label: { fi: 'Postilokeron osoiteteksti' } });
    export const puhelinnumero = createAttribute(model, null, { label: { fi: 'Puhelinnumero' } });
    export const selite = createAttribute(model, null, { label: { fi: 'Selite' } });
    export const sukunimi = createAttribute(model, null, { label: { fi: 'Sukunimi' } });
    export const tehtavakoodi = createAttribute(model, null, { label: { fi: 'Tehtäväkoodi' } });
    export const tunniste = createAttribute(model, null, { label: { fi: 'Tunniste' } });
    export const tunnus = createAttribute(model, null, { label: { fi: 'Tunnus' } });
    export const tyyppi = createAttribute(model, null, { label: { fi: 'Tyyppi' } });
    export const viittaussuhdeteksti = createAttribute(model, null, { label: { fi: 'Viittaussuhdeteksti' } });
    export const ytunnus = createAttribute(model, 'xsd:string', { label: { fi: 'Y-tunnus' } });
  }

  export namespace Classes {

    export const aikavali = createClass(model,
      { label:   { fi: 'Aikaväli' },
        comment: { fi: 'Ajankohdista muodostuva ajallinen jatkumo' },
        properties: [
          [Jhs.Attributes.alkamishetki, { label: { fi: 'Aikavälin alkamishetki' } }],
          [Jhs.Attributes.paattymishetki, { label: { fi: 'Aikavälin päättymishetki' } }]
        ]});

    export const ajanjakso = createClass(model, { label: { fi: 'Ajanjakso' }, comment: { fi: 'Nimetty aikaväli, joka voidaan määritellä eri tarkkuudella'  } });
    export const asia = createClass(model, { label: { fi: 'Asia' }, comment: { fi : 'Tehtävän yksittäinen instanssi, joka käsitellään prosessin mukaisessa menettelyssä.'  } });
    export const asiakirja = createClass(model, { label: { fi: 'Asiakirja'  } });
    export const henkilo = createClass(model, { label: { fi: 'Henkilö'  } });
    export const organisaatio = createClass(model, { label: { fi: 'Organisaatio'  } });
    export const osoite = createClass(model, { label: { fi: 'Osoite'  } });
    export const yhteystieto = createClass(model, { label: { fi: 'Yhteystieto'  } });
  }
}

namespace Edu {

  export const model = createLibrary('edu', ktkGroupId, {
    label:   { fi: 'Opiskelun, opetuksen ja koulutuksen tietokomponentit',
               en: 'Core Vocabulary of Education' },
    comment: { fi: 'Opiskelun, opetuksen ja koulutuksen yhteiset tietokomponentit',
               en: 'Common core data model of teaching, learning and education' }
  });
}

namespace Oili {

  export const model = createProfile('oili', ktkGroupId, {
    label:   { fi: 'Opiskelijaksi ilmoittautuminen esimerkkiprofiili' },
    comment: { fi: 'Esimerkki profiilin ominaisuuksista OILI casella' }
  });
}
