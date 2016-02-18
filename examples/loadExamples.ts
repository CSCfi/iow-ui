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


function isPromise<T>(obj:any): obj is IPromise<T> {
  return !!(obj && obj.then);
}

interface EntityDetails {
  label: Localizable;
  comment?: Localizable;
}

interface ClassDetails extends EntityDetails {
  properties?: [IPromise<Predicate>, EntityDetails][]
}

interface AttributeDetails extends EntityDetails {
  dataType?: string;
}

interface AssociationDetails extends EntityDetails {
  valueClass?: Uri|(() => IPromise<Class>);
}

interface PropertyDetails extends EntityDetails {
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

function createPredicate<T extends Predicate>(modelPromise: IPromise<Model>, type: Type, details: EntityDetails, mangler: (predicate: T) => IPromise<any>): IPromise<T> {
  return modelPromise
    .then(model => predicateService.newPredicate(model, details.label['fi'], asiaConceptId, type, 'fi'))
    .then((predicate: T) => {
      setDetails(predicate, details);
      return mangler(predicate).then(() => predicateService.createPredicate(predicate).then(() => predicate));
    });
}

function createAttribute(modelPromise: IPromise<Model>, details: AttributeDetails): IPromise<Attribute> {
  return createPredicate<Attribute>(modelPromise, 'attribute', details, attribute => {
    attribute.dataType = details.dataType;
    return q.when();
  });
}

function createAssociation(modelPromise: IPromise<Model>, details: AssociationDetails): IPromise<Association> {
  return createPredicate<Association>(modelPromise, 'association', details, association => {
    const valueClass = details.valueClass;

    if (typeof valueClass === 'function') {
      const vc = valueClass();
      if (isPromise<Class>(vc)) {
        return vc.then(klass => {
          association.valueClass = klass.curie;
        });
      } else {
        throw new Error('Must be promise');
      }
    } else if (typeof valueClass === 'string') {
      association.valueClass = valueClass;
    }
    return q.when();
  });
}

function createProperty(predicatePromise: IPromise<Predicate>, details: PropertyDetails): IPromise<Property> {
  return predicatePromise
    .then(p => classService.newProperty(p.id))
    .then(p => {
      setDetails(p, details);
      return p;
    });
}

namespace Jhs {

  export const model = createLibrary('jhs', jhsGroupId, {
    label:   { fi: 'Julkishallinnon tietokomponentit' },
    comment: { fi: 'Julkisessa hallinnossa ja kaikilla toimialoilla yleisesti käytössä olevat tietosisällöt' }
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

    export const aikavali = createClass(model,
      { label:   { fi: 'Aikaväli' },
        comment: { fi: 'Ajankohdista muodostuva ajallinen jatkumo' },
        properties: [
          [Jhs.Attributes.alkamishetki, { label: { fi: 'Aikavälin alkamishetki' } }],
          [Jhs.Attributes.paattymishetki, { label: { fi: 'Aikavälin päättymishetki' } }]
        ]});

    export const ajanjakso = createClass(model, {
      label: { fi: 'Ajanjakso' },
      comment: { fi: 'Nimetty aikaväli, joka voidaan määritellä eri tarkkuudella'  }
    });

    export const asia = createClass(model, {
      label: { fi: 'Asia' },
      comment: { fi : 'Tehtävän yksittäinen instanssi, joka käsitellään prosessin mukaisessa menettelyssä.'  }
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
