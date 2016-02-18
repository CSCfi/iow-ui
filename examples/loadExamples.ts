import IPromise = angular.IPromise;
import * as _ from 'lodash';
import { httpService } from './requestToAngularHttpService';
import {
  EntityDeserializer, Localizable, Uri, Type, Model, Predicate, Attribute,
  Association, Class, Property, State, Curie
} from '../src/services/entities';
import { ModelService } from '../src/services/modelService';
import { ClassService } from '../src/services/classService';
import { PredicateService } from '../src/services/predicateService';
import { UserService } from '../src/services/userService';
import { config } from '../src/config';
import { ConceptService } from '../src/services/conceptService';

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
const conceptService = new ConceptService(httpService, q, entityDeserializer);

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
const schemesPromise = conceptService.getAllSchemes('fi').then(result => result.data.vocabularies);

function ensureLoggedIn(): IPromise<any> {
  return userService.updateLogin()
    .then<any>(user => !user.isLoggedIn() ? httpService.get(config.apiEndpoint + '/login').then(() => userService.updateLogin()) : q.when());
}

function nop<T>(response: any) {
  return response;
}

function reportFailure<T>(err: any) {
  console.log('========');
  console.log('=FAILED=');
  console.log('========');
  console.log(err);
  console.log('========');
  throw new Error(err);
}

function isPromise<T>(obj:any): obj is IPromise<T> {
  return !!(obj && obj.then);
}

function asCuriePromise<T extends {curie: Curie}>(link: Uri|(() => IPromise<T>)): IPromise<Curie> {
  if (typeof link === 'function') {
    const promise = link();
    if (isPromise<T>(promise)) {
      return promise.then(withCurie => withCurie.curie);
    } else {
      throw new Error('Must be promise');
    }
  } else if (typeof link === 'string') {
    return q.when(link);
  } else {
    return q.when(null);
  }
}

interface EntityDetails {
  label: Localizable;
  comment?: Localizable;
  state?: State;
}

interface ModelDetails extends EntityDetails {
  references?: string[];
  requires?: (() => IPromise<Model>)[]
}

interface ClassDetails extends EntityDetails {
  subClassOf?: Curie|(() => IPromise<Class>);
  conceptId?: Uri;
  equivalentClasses?: (Curie|(() => IPromise<Class>))[];
  properties?: [(() => IPromise<Predicate>), PropertyDetails][]
}

interface ShapeDetails extends EntityDetails {
  equivalentClasses?: (Curie|(() => IPromise<Class>))[];
  properties?: [(() => IPromise<Predicate>), PropertyDetails][]
}

interface PredicateDetails extends EntityDetails {
  subPropertyOf?: Curie|(() => IPromise<Predicate>);
  conceptId?: Uri;
  equivalentProperties?: (Curie|(() => IPromise<Predicate>))[];
}

interface AttributeDetails extends PredicateDetails {
  dataType?: string;
}

interface AssociationDetails extends PredicateDetails {
  valueClass?: Uri|(() => IPromise<Class>);
}

interface PropertyDetails extends EntityDetails {
  example?: string;
  dataType?: string;
  valueClass?: Uri|(() => IPromise<Class>);
  minCount?: number;
  maxCount?: number;
  pattern?: string;
}

function setDetails(entity: { label: Localizable, comment: Localizable, state: State }, details: EntityDetails) {
  entity.label = details.label;
  entity.comment = details.comment;
  if (details.state) {
    entity.state = details.state;
  }
}

function createModel(prefix: string, groupId: Uri, type: Type, details: ModelDetails): IPromise<Model> {

  const modelIdNamespace = 'http://iow.csc.fi/' + (type === 'library' ? 'ns'  : 'ap') + '/';

  return groupsDone
    .then(() => modelService.deleteModel(modelIdNamespace + prefix))
    .then(nop, nop)
    .then(() => modelService.newModel(prefix, details.label['fi'], groupId, 'fi', type))
    .then(model => {
      setDetails(model, details);

      const promises: IPromise<any>[] = [];

      for (var reference of details.references || []) {
        promises.push(
          schemesPromise.then((schemes: any) => {
              const scheme = _.find(schemes, (scheme: any) => scheme.id === reference);
              if (!scheme) {
                console.log(schemes);
                throw new Error('Reference not found: ' + reference);
              }
              return scheme;
            })
            .then(scheme => modelService.newReference(scheme, 'fi', model.context))
            .then(referenceEntity => model.addReference(referenceEntity))
        );
      }

      for (const require of details.requires || []) {
        promises.push(
          require()
            .then(requiredModel => modelService.newRequire(requiredModel.namespace, requiredModel.prefix, requiredModel.label['fi'], 'fi'))
            .then(require => model.addRequire(require))
        );
      }

      return q.all(promises)
        .then(() => modelService.createModel(model))
        .then(() => model);
    })
    .then(nop, reportFailure);
}

function createLibrary(prefix: string, groupId: Uri, details: ModelDetails): IPromise<Model> {
  return createModel(prefix, groupId, 'library', details);
}

function createProfile(prefix: string, groupId: Uri, details: ModelDetails): IPromise<Model> {
  return createModel(prefix, groupId, 'profile', details);
}

function assignClass(modelPromise: IPromise<Model>, classPromise: IPromise<Class>): IPromise<Class> {
  return q.all([modelPromise, classPromise])
    .then(result => {
      const model = <Model> result[0];
      const klass = <Class> result[1];
      return classService.assignClassToModel(klass.id, model.id).then(() => klass)
    })
    .then(nop, reportFailure);
}

function specializeClass(modelPromise: IPromise<Model>, classPromise: IPromise<Class>, details: ShapeDetails): IPromise<Class> {
  return q.all([modelPromise, classPromise])
    .then(result => {
      const model = <Model> result[0];
      const klass = <Class> result[1];
      return classService.newShape(klass.id, model, 'fi')
        .then(shape => {
          setDetails(shape, details);

          const promises: IPromise<any>[] = [];

          for (const [predicatePromiseFn, propertyDetails] of details.properties || []) {
            promises.push(createProperty(predicatePromiseFn(), propertyDetails).then(property => {
              shape.addProperty(property);
            }));
          }

          for (const equivalentClass of details.equivalentClasses || []) {
            promises.push(asCuriePromise(equivalentClass).then(curie => shape.equivalentClasses.push(curie)));
          }

          return q.all(promises)
            .then(() => classService.createClass(shape))
            .then(() => shape)
            .then(nop, reportFailure);
        })
    });
}

function createClass(modelPromise: IPromise<Model>, details: ClassDetails): IPromise<Class> {
  return modelPromise
    .then(model => classService.newClass(model, details.label['fi'], details.conceptId || asiaConceptId, 'fi'))
    .then(klass => {
      setDetails(klass, details);

      const promises: IPromise<any>[] = [];

      for (const [predicatePromiseFn, propertyDetails] of details.properties || []) {
        promises.push(createProperty(predicatePromiseFn(), propertyDetails).then(property => {
          klass.addProperty(property);
        }));
      }

      promises.push(asCuriePromise(details.subClassOf).then(curie => klass.subClassOf = curie));

      for (const equivalentClass of details.equivalentClasses || []) {
        promises.push(asCuriePromise(equivalentClass).then(curie => klass.equivalentClasses.push(curie)));
      }

      return q.all(promises)
        .then(() => classService.createClass(klass))
        .then(() => klass)
        .then(nop, reportFailure);
    });
}

function assignPredicate(modelPromise: IPromise<Model>, predicatePromise: IPromise<Predicate>): IPromise<Predicate> {
  return q.all([modelPromise, predicatePromise])
    .then(result => {
      const model = <Model> result[0];
      const predicate = <Predicate> result[1];
      return predicateService.assignPredicateToModel(predicate.id, model.id).then(() => predicate)
    })
    .then(nop, reportFailure);
}

function createPredicate<T extends Predicate>(modelPromise: IPromise<Model>, type: Type, details: PredicateDetails, mangler: (predicate: T) => IPromise<any>): IPromise<T> {
  return modelPromise
    .then(model => predicateService.newPredicate(model, details.label['fi'], details.conceptId || asiaConceptId, type, 'fi'))
    .then((predicate: T) => {
      setDetails(predicate, details);

      const promises: IPromise<any>[] = [];

      promises.push(asCuriePromise(details.subPropertyOf).then(curie => predicate.subPropertyOf = curie));

      for (const equivalentProperty of details.equivalentProperties || []) {
        promises.push(asCuriePromise(equivalentProperty).then(curie => predicate.equivalentProperties.push(curie)));
      }

      promises.push(mangler(predicate));

      return q.all(promises)
        .then(() => predicateService.createPredicate(predicate))
        .then(() => predicate)
        .then(nop, reportFailure);
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
      return asCuriePromise(details.valueClass)
        .then(curie => association.valueClass = curie);
  });
}

function createProperty(predicatePromise: IPromise<Predicate>, details: PropertyDetails): IPromise<Property> {
  return predicatePromise
    .then(p => classService.newProperty(p.id))
    .then(p => {
      setDetails(p, details);

      const valueClassPromise = asCuriePromise(details.valueClass).then(curie => p.valueClass = curie);

      if (details.dataType) {
        p.dataType = details.dataType;
      }

      p.example = details.example;
      p.minCount = details.minCount;
      p.maxCount = details.maxCount;
      p.pattern = details.pattern;

      return valueClassPromise.then(() => p);
    })
    .then(nop, reportFailure);
}

namespace Jhs {

  export const model = createLibrary('jhs', jhsGroupId, {
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
          [() => Jhs.Attributes.alkamishetki, { label: { fi: 'Aikavälin alkamishetki' } }],
          [() => Jhs.Attributes.paattymishetki, { label: { fi: 'Aikavälin päättymishetki' } }]
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
               en: 'Common core data model of teaching, learning and education' },
    requires: [() => Jhs.model]
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

  export const model = createProfile('oili', ktkGroupId, {
    label:   { fi: 'Opiskelijaksi ilmoittautuminen esimerkkiprofiili' },
    comment: { fi: 'Esimerkki profiilin ominaisuuksista OILI casella' },
    requires: [() => Jhs.model, () => Edu.model]
  });

  export namespace Attributes {
  }

  export namespace Associations {
  }

  export namespace Classes {
    const yhteystiedot = specializeClass(model, Jhs.Classes.yhteystieto, {
      label: { fi: 'Yhteystiedot' }
    });
  }
}
