import IPromise = angular.IPromise;
import * as _ from 'lodash';
import { httpService } from './requestToAngularHttpService';
import {
  EntityDeserializer, Localizable, Uri, Type, Model, Predicate, Attribute,
  Association, Class, Property, State, Curie, ConceptSuggestion
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

function assertPropertyValueExists(obj: any, property: string) {
  if (obj.hasOwnProperty(property)) {
    return assertExists(obj[property], ' property: ' + property);
  }

  return obj[property];
}

function assertExists<T>(obj: T, msg: string): T {
  if (obj === null || obj === undefined) {
    reportFailure('Null or undefined: ' + msg);
  }
  return obj;
}

function isPromise<T>(obj:any): obj is IPromise<T> {
  return !!(obj && obj.then);
}

function isPromiseProvider<T>(obj:any): obj is (() => IPromise<T>) {
  return typeof obj === 'function';
}

function isConceptSuggestion(obj: any): obj is ConceptSuggestionDetails {
  return typeof obj === 'object';
}

function asCuriePromise<T extends { curie: Curie }>(resolvable: CurieResolvable<T>): IPromise<Curie> {
  if (isPromiseProvider(resolvable)) {
    const promise = resolvable();
    if (isPromise<T>(promise)) {
      return promise.then(withCurie => withCurie.curie);
    } else {
      throw new Error('Must be promise');
    }
  } else if (isPromise(resolvable)) {
    return resolvable.then(withCurie => withCurie.curie);
  } else if (typeof resolvable === 'string') {
    return q.when(resolvable);
  } else {
    return q.when(null);
  }
}

function asPromise<T>(resolvable: Resolvable<T>): IPromise<T> {
  if (isPromiseProvider<T>(resolvable)) {
    return resolvable();
  } else if (isPromise<T>(resolvable)) {
    return resolvable;
  } else {
    throw new Error('Not resolvable: ' + resolvable);
  }
}

type Resolvable<T> = IPromise<T>|(() => IPromise<T>);
type CurieResolvable<T extends { curie: Curie }> = Curie|IPromise<T>|(() => IPromise<T>);

export interface EntityDetails {
  label: Localizable;
  comment?: Localizable;
  state?: State;
}

export interface ModelDetails extends EntityDetails {
  prefix: string,
  references?: string[];
  requires?: Resolvable<Model>[]
}

export interface ClassDetails extends EntityDetails {
  id?: string,
  subClassOf?: CurieResolvable<Class>;
  concept?: Uri|ConceptSuggestionDetails;
  equivalentClasses?: CurieResolvable<Class>[];
  properties?: PropertyDetails[]
}

export interface ShapeDetails extends EntityDetails {
  class: Resolvable<Class>;
  id?: string,
  equivalentClasses?: CurieResolvable<Class>[];
  properties?: PropertyDetails[]
}

export interface PredicateDetails extends EntityDetails {
  id?: string,
  subPropertyOf?: CurieResolvable<Predicate>;
  concept?: Uri|ConceptSuggestionDetails;
  equivalentProperties?: CurieResolvable<Predicate>[];
}

export interface AttributeDetails extends PredicateDetails {
  dataType?: string;
}

export interface AssociationDetails extends PredicateDetails {
  valueClass?: CurieResolvable<Class>;
}

export interface PropertyDetails extends EntityDetails {
  predicate: Resolvable<Predicate>;
  example?: string;
  dataType?: string;
  valueClass?: CurieResolvable<Class>;
  minCount?: number;
  maxCount?: number;
  pattern?: string;
}

export interface ConceptSuggestionDetails {
  label: string;
  comment: string;
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

export function createConceptSuggestion(details: ConceptSuggestionDetails): IPromise<ConceptSuggestion> {
  return ensureLoggedIn()
    .then(() => conceptService.createConceptSuggestion("http://www.finto.fi/jhsmeta", details.label, details.comment, null, 'fi'))
    .then(conceptId => conceptService.getConceptSuggestion(conceptId));
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
          asPromise(assertExists(require, 'require for ' + model.label['fi']))
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
    .then(([model, klass]: [Model, Class]) => classService.assignClassToModel(klass.id, model.id).then(() => klass))
    .then(nop, reportFailure);
}

export function specializeClass(modelPromise: IPromise<Model>, details: ShapeDetails): IPromise<Class> {
  return q.all([modelPromise, asPromise(assertExists(details.class, 'class to specialize for ' + details.label['fi']))])
    .then(([model, klass]: [Model, Class]) => {
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
            promises.push(asCuriePromise(assertExists(equivalentClass, 'equivalent class for ' + details.label['fi'])).then(curie => shape.equivalentClasses.push(curie)));
          }

          return q.all(promises)
            .then(() => classService.createClass(shape))
            .then(() => shape)
            .then(nop, reportFailure);
        })
    });
}

export function createClass(modelPromise: IPromise<Model>, details: ClassDetails): IPromise<Class> {

  const concept = details.concept;
  const conceptIdPromise = isConceptSuggestion(concept)
    ? createConceptSuggestion(concept).then(conceptSuggestion => conceptSuggestion.id)
    : q.when(concept || asiaConceptId);

  return q.all([modelPromise, conceptIdPromise])
    .then(([model, conceptId]: [Model, Uri]) => classService.newClass(model, details.label['fi'], conceptId || asiaConceptId, 'fi'))
    .then(klass => {
      setDetails(klass, details);
      setId(klass, details);

      const promises: IPromise<any>[] = [];

      for (const property of details.properties || []) {
        promises.push(createProperty(property).then(property => klass.addProperty(property)));
      }

      assertPropertyValueExists(details, 'subClassOf for ' + details.label['fi']);
      promises.push(asCuriePromise(details.subClassOf).then(curie => klass.subClassOf = curie));

      for (const equivalentClass of details.equivalentClasses || []) {
        promises.push(asCuriePromise(assertExists(equivalentClass, 'equivalent class for ' + details.label['fi'])).then(curie => klass.equivalentClasses.push(curie)));
      }

      return q.all(promises)
        .then(() => classService.createClass(klass))
        .then(() => klass)
        .then(nop, reportFailure);
    });
}

export function assignPredicate(modelPromise: IPromise<Model>, predicatePromise: IPromise<Predicate>): IPromise<Predicate> {
  return q.all([modelPromise, predicatePromise])
    .then(([model, predicate]: [Model, Predicate]) => predicateService.assignPredicateToModel(predicate.id, model.id).then(() => predicate))
    .then(nop, reportFailure);
}

export function createPredicate<T extends Predicate>(modelPromise: IPromise<Model>, type: Type, details: PredicateDetails, mangler: (predicate: T) => IPromise<any>): IPromise<T> {

  const concept = details.concept;
  const conceptIdPromise = isConceptSuggestion(concept)
    ? createConceptSuggestion(concept).then(conceptSuggestion => conceptSuggestion.id)
    : q.when(concept || asiaConceptId);

  return q.all([modelPromise, conceptIdPromise])
    .then(([model, conceptId]: [Model, Uri]) => predicateService.newPredicate(model, details.label['fi'], conceptId || asiaConceptId, type, 'fi'))
    .then((predicate: T) => {
      setDetails(predicate, details);
      setId(predicate, details);

      const promises: IPromise<any>[] = [];

      assertPropertyValueExists(details, 'subPropertyOf for ' + details.label['fi]']);
      promises.push(asCuriePromise(details.subPropertyOf).then(curie => predicate.subPropertyOf = curie));

      for (const equivalentProperty of details.equivalentProperties || []) {
        promises.push(asCuriePromise(assertExists(equivalentProperty, 'equivalent property for ' + details.label['fi'])).then(curie => predicate.equivalentProperties.push(curie)));
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
    assertPropertyValueExists(details, 'valueClass for association ' + details.label['fi']);
    return asCuriePromise(details.valueClass)
      .then(curie => association.valueClass = curie);
  });
}

export function createProperty(details: PropertyDetails): IPromise<Property> {
  return asPromise(assertExists(details.predicate, 'predicate'))
    .then(p => classService.newProperty(p.id))
    .then((p: Property) => {
      setDetails(p, details);
      assertPropertyValueExists(details, 'valueClass for property ' + details.label['fi']);
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
