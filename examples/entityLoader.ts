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
import { splitCurie } from '../src/services/utils';

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

export const ktkGroupId = 'https://tt.eduuni.fi/sites/csc-iow#KTK';
export const jhsGroupId = 'https://tt.eduuni.fi/sites/csc-iow#JHS';
export const asiaConceptId = 'http://jhsmeta.fi/skos/J392';

export const loggedIn = ensureLoggedIn();
export const groupsDone = loggedIn.then(() => makeRawRequest('/api/rest/groups', 'exampleGroups.json'));
export const schemesPromise = conceptService.getAllSchemes('fi').then(result => result.data.vocabularies);

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

export interface EntityDetails {
  label: Localizable;
  comment?: Localizable;
  state?: State;
}

export interface ModelDetails extends EntityDetails {
  prefix: string,
  references?: string[];
  requires?: (() => IPromise<Model>)[]
}

export interface ClassDetails extends EntityDetails {
  id?: string,
  subClassOf?: Curie|(() => IPromise<Class>);
  conceptId?: Uri;
  equivalentClasses?: (Curie|(() => IPromise<Class>))[];
  properties?: PropertyDetails[]
}

export interface ShapeDetails extends EntityDetails {
  id?: string,
  equivalentClasses?: (Curie|(() => IPromise<Class>))[];
  properties?: PropertyDetails[]
}

export interface PredicateDetails extends EntityDetails {
  id?: string,
  subPropertyOf?: Curie|(() => IPromise<Predicate>);
  conceptId?: Uri;
  equivalentProperties?: (Curie|(() => IPromise<Predicate>))[];
}

export interface AttributeDetails extends PredicateDetails {
  dataType?: string;
}

export interface AssociationDetails extends PredicateDetails {
  valueClass?: Uri|(() => IPromise<Class>);
}

export interface PropertyDetails extends EntityDetails {
  predicate: () => IPromise<Predicate>;
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

function setId(entity: { curie: Curie }, details: { id?: string }) {
  if (details.id) {
    const {prefix, value} = splitCurie(entity.curie);
    entity.curie = prefix + ':' + details.id;
  }
}

export function createModel(type: Type, groupId: Uri, details: ModelDetails): IPromise<Model> {

  const modelIdNamespace = 'http://iow.csc.fi/' + (type === 'library' ? 'ns'  : 'ap') + '/';

  return groupsDone
    .then(() => modelService.deleteModel(modelIdNamespace + details.prefix))
    .then(nop, nop)
    .then(() => modelService.newModel(details.prefix, details.label['fi'], groupId, 'fi', type))
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

export function createLibrary(groupId: Uri, details: ModelDetails): IPromise<Model> {
  return createModel('library', groupId, details);
}

export function createProfile(groupId: Uri, details: ModelDetails): IPromise<Model> {
  return createModel('profile', groupId, details);
}

export function assignClass(modelPromise: IPromise<Model>, classPromise: IPromise<Class>): IPromise<Class> {
  return q.all([modelPromise, classPromise])
    .then(result => {
      const model = <Model> result[0];
      const klass = <Class> result[1];
      return classService.assignClassToModel(klass.id, model.id).then(() => klass)
    })
    .then(nop, reportFailure);
}

export function specializeClass(modelPromise: IPromise<Model>, classPromise: IPromise<Class>, details: ShapeDetails): IPromise<Class> {
  return q.all([modelPromise, classPromise])
    .then(result => {
      const model = <Model> result[0];
      const klass = <Class> result[1];
      return classService.newShape(klass.id, model, 'fi')
        .then(shape => {
          setDetails(shape, details);
          setId(shape, details);

          const promises: IPromise<any>[] = [];

          for (const property of details.properties || []) {
            promises.push(createProperty(property).then(property => {
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

export function createClass(modelPromise: IPromise<Model>, details: ClassDetails): IPromise<Class> {
  return modelPromise
    .then(model => classService.newClass(model, details.label['fi'], details.conceptId || asiaConceptId, 'fi'))
    .then(klass => {
      setDetails(klass, details);
      setId(klass, details);

      const promises: IPromise<any>[] = [];

      for (const property of details.properties || []) {
        promises.push(createProperty(property).then(property => {
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

export function assignPredicate(modelPromise: IPromise<Model>, predicatePromise: IPromise<Predicate>): IPromise<Predicate> {
  return q.all([modelPromise, predicatePromise])
    .then(result => {
      const model = <Model> result[0];
      const predicate = <Predicate> result[1];
      return predicateService.assignPredicateToModel(predicate.id, model.id).then(() => predicate)
    })
    .then(nop, reportFailure);
}

export function createPredicate<T extends Predicate>(modelPromise: IPromise<Model>, type: Type, details: PredicateDetails, mangler: (predicate: T) => IPromise<any>): IPromise<T> {
  return modelPromise
    .then(model => predicateService.newPredicate(model, details.label['fi'], details.conceptId || asiaConceptId, type, 'fi'))
    .then((predicate: T) => {
      setDetails(predicate, details);
      setId(predicate, details);

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

export function createAttribute(modelPromise: IPromise<Model>, details: AttributeDetails): IPromise<Attribute> {
  return createPredicate<Attribute>(modelPromise, 'attribute', details, attribute => {
    attribute.dataType = details.dataType;
    return q.when();
  });
}

export function createAssociation(modelPromise: IPromise<Model>, details: AssociationDetails): IPromise<Association> {
  return createPredicate<Association>(modelPromise, 'association', details, association => {
    return asCuriePromise(details.valueClass)
      .then(curie => association.valueClass = curie);
  });
}

export function createProperty(details: PropertyDetails): IPromise<Property> {
  return details.predicate()
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
