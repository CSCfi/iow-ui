import IPromise = angular.IPromise;
import IQService = angular.IQService;
import * as _ from 'lodash';
import {
  Localizable,
  Type,
  Model,
  Predicate,
  Attribute,
  Association,
  Class,
  Property,
  State,
  ConceptSuggestion,
  ConstraintType,
  Url
} from './entities';
import { ModelService } from './modelService';
import { ClassService } from './classService';
import { PredicateService } from './predicateService';
import { UserService } from './userService';
import { identity } from './utils';
import { ConceptService } from './conceptService';
import { ResetService } from './resetService';
import { Uri } from './uri';

export const asiaConceptId = new Uri('http://jhsmeta.fi/skos/J392');
export const ktkGroupId = new Uri('https://tt.eduuni.fi/sites/csc-iow#KTK');
export const jhsGroupId = new Uri('https://tt.eduuni.fi/sites/csc-iow#JHS');
export const jhsMetaId = new Uri('http://www.finto.fi/jhsmeta');

export type Resolvable<T> = IPromise<T>|(() => IPromise<T>);
export type UriResolvable<T extends { id: Uri }> = Url|IPromise<T>|(() => IPromise<T>);

export interface EntityDetails {
  label: Localizable;
  comment?: Localizable;
  state?: State;
}

export interface ExternalRequireDetails {
  prefix: string;
  namespace: Url;
  label: string;
}

export interface ModelDetails extends EntityDetails {
  prefix: string,
  references?: string[];
  requires?: (Resolvable<Model>|ExternalRequireDetails)[]
}

export interface ConstraintDetails {
  type: ConstraintType;
  comment: Localizable;
  shapes: Resolvable<Class>[];
}

export interface ClassDetails extends EntityDetails {
  id?: string,
  subClassOf?: UriResolvable<Class>;
  concept?: Url|ConceptSuggestionDetails;
  equivalentClasses?: UriResolvable<Class>[];
  properties?: PropertyDetails[];
  constraint?: ConstraintDetails;
}

export interface ShapeDetails extends EntityDetails {
  class: Resolvable<Class>;
  id?: string,
  equivalentClasses?: UriResolvable<Class>[];
  properties?: PropertyDetails[];
  constraint?: ConstraintDetails;
}

export interface PredicateDetails extends EntityDetails {
  id?: string,
  subPropertyOf?: UriResolvable<Predicate>;
  concept?: string|ConceptSuggestionDetails;
  equivalentProperties?: UriResolvable<Predicate>[];
}

export interface AttributeDetails extends PredicateDetails {
  dataType?: string;
}

export interface AssociationDetails extends PredicateDetails {
  valueClass?: UriResolvable<Class>;
}

export interface PropertyDetails extends EntityDetails {
  predicate: Resolvable<Predicate>;
  example?: string;
  dataType?: string;
  valueClass?: UriResolvable<Class>;
  minCount?: number;
  maxCount?: number;
  pattern?: string;
}

export interface ConceptSuggestionDetails {
  label: string;
  comment: string;
}

export class EntityLoaderService {
  /* @ngInject */
  constructor(private $q: IQService,
              private modelService: ModelService,
              private predicateService: PredicateService,
              private classService: ClassService,
              private userService: UserService,
              private conceptService: ConceptService,
              private resetService: ResetService) {
  }

  create(shouldReset: boolean): EntityLoader {
    return new EntityLoader(this.$q, this.modelService, this.predicateService, this.classService, this.userService, this.conceptService, this.resetService, shouldReset);
  }
}

export class EntityLoader {

  private reset: IPromise<any>;
  private loggedIn: IPromise<any>;
  private schemes: IPromise<any>;
  private actions: IPromise<any>[] = [];

  constructor(private $q: IQService,
              private modelService: ModelService,
              private predicateService: PredicateService,
              private classService: ClassService,
              private userService: UserService,
              private conceptService: ConceptService,
              private resetService: ResetService,
              private shouldReset: boolean) {

    this.reset = shouldReset ? resetService.reset() : $q.when();
    this.loggedIn = this.reset.then(() => userService.login());
    this.schemes = this.reset.then(() => this.conceptService.getAllSchemes('fi')).then(result => result.data.vocabularies);
  }

  addAction<T>(action: IPromise<T>, details: any): IPromise<T> {
    const withDetails = action.then(identity, failWithDetails(details));
    this.actions.push(withDetails);
    return withDetails;
  }

  result(successCallback: () => void, errorCallback: (err: any) => void) {
    this.$q.all(this.actions).then(successCallback, errorCallback);
  }

  createConceptSuggestion(details: ConceptSuggestionDetails): IPromise<ConceptSuggestion> {
    const result = this.loggedIn
      .then(() => this.conceptService.createConceptSuggestion(jhsMetaId, details.label, details.comment, null, 'fi'))
      .then(conceptId => this.conceptService.getConceptSuggestion(conceptId));

    return this.addAction(result, details);
  }

  private createModel(type: Type, groupId: Uri, details: ModelDetails): IPromise<Model> {
    const result = this.loggedIn
      .then(() => this.modelService.newModel(details.prefix, details.label['fi'], groupId, 'fi', type))
      .then(model => {
        setDetails(model, details);

        const promises: IPromise<any>[] = [];

        for (var reference of details.references || []) {
          promises.push(
            this.schemes.then((schemes: any) => {
                const scheme = _.find(schemes, (scheme: any) => scheme.id === reference);
                if (!scheme) {
                  throw new Error('Reference not found: ' + reference);
                }
                return scheme;
              })
              .then(scheme => this.modelService.newReference(scheme, 'fi', model.context))
              .then(referenceEntity => model.addReference(referenceEntity))
          );
        }

        for (const require of details.requires || []) {

          if (isUriResolvable(require)) {
            promises.push(
              asPromise(assertExists(require, 'require for ' + model.label['fi']))
                .then(requiredModel => this.modelService.newRequire(requiredModel.namespace, requiredModel.prefix, requiredModel.label['fi'], 'fi'))
                .then(newRequire => model.addRequire(newRequire))
            );
          } else if (isExternalRequire(require)) {
            promises.push(this.modelService.newRequire(require.namespace, require.prefix, require.label, 'fi')
              .then(newRequire => model.addRequire(newRequire))
            );
          } else {
            throw new Error('Unknown require: ' + require);
          }
        }

        return this.$q.all(promises)
          .then(() => this.modelService.createModel(model))
          .then(() => model);
      });

    return this.addAction(result, details);
  }

  createLibrary(groupId: Uri, details: ModelDetails): IPromise<Model> {
    return this.createModel('library', groupId, details);
  }

  createProfile(groupId: Uri, details: ModelDetails): IPromise<Model> {
    return this.createModel('profile', groupId, details);
  }

  assignClass(modelPromise: IPromise<Model>, classPromise: IPromise<Class>): IPromise<Class> {
    const result = this.loggedIn
      .then(() => this.$q.all([modelPromise, classPromise]))
      .then(([model, klass]: [Model, Class]) => this.classService.assignClassToModel(klass.id, model.id).then(() => klass));

    return this.addAction(result, 'assign class');
  }

  specializeClass(modelPromise: IPromise<Model>, details: ShapeDetails): IPromise<Class> {
    const result = this.loggedIn
      .then(() =>  this.$q.all([modelPromise, asPromise(assertExists(details.class, 'class to specialize for ' + details.label['fi']))]))
      .then(([model, klass]: [Model, Class]) => {
        return this.classService.newShape(klass, model, 'fi')
          .then(shape => {
            setDetails(shape, details);
            setId(shape, details);

            const promises: IPromise<any>[] = [];

            for (const property of details.properties || []) {
              promises.push(this.createProperty(property).then(property => {
                shape.addProperty(property);
              }));
            }

            for (const equivalentClass of details.equivalentClasses || []) {
              promises.push(asUriPromise(assertExists(equivalentClass, 'equivalent class for ' + details.label['fi'])).then(id => shape.equivalentClasses.push(id)));
            }

            if (details.constraint) {
              shape.constraint.constraint = details.constraint.type;
              shape.constraint.comment = details.constraint.comment;

              for (const constraintShape of details.constraint.shapes) {
                promises.push(asPromise(assertExists(constraintShape, 'constraint item for ' + details.label['fi'])).then(item => shape.constraint.addItem(item)));
              }
            }

            return this.$q.all(promises)
              .then(() => this.classService.createClass(shape))
              .then(() => shape)
          })
      });

    return this.addAction(result, details);
  }

  createClass(modelPromise: IPromise<Model>, details: ClassDetails): IPromise<Class> {

    const concept = details.concept;
    const conceptIdPromise = isConceptSuggestion(concept)
      ? this.createConceptSuggestion(concept).then(conceptSuggestion => conceptSuggestion.id)
      : concept ? this.$q.when(new Uri(<string> concept)) : this.$q.when(asiaConceptId);

    const result = this.loggedIn
      .then(() =>  this.$q.all([modelPromise, conceptIdPromise]))
      .then(([model, conceptId]: [Model, Uri]) => this.classService.newClass(model, details.label['fi'], conceptId, 'fi'))
      .then((klass: Class) => {
        setDetails(klass, details);
        setId(klass, details);

        const promises: IPromise<any>[] = [];

        for (const property of details.properties || []) {
          promises.push(this.createProperty(property).then(property => klass.addProperty(property)));
        }

        assertPropertyValueExists(details, 'subClassOf for ' + details.label['fi']);
        promises.push(asUriPromise(details.subClassOf).then(uri => klass.subClassOf = uri));

        for (const equivalentClass of details.equivalentClasses || []) {
          promises.push(asUriPromise(assertExists(equivalentClass, 'equivalent class for ' + details.label['fi'])).then(uri => klass.equivalentClasses.push(uri)));
        }

        if (details.constraint) {
          klass.constraint.constraint = details.constraint.type;
          klass.constraint.comment = details.constraint.comment;

          for (const constraintShape of details.constraint.shapes) {
            promises.push(asPromise(assertExists(constraintShape, 'constraint item for ' + details.label['fi'])).then(item => klass.constraint.addItem(item)));
          }
        }

        return this.$q.all(promises)
          .then(() => this.classService.createClass(klass))
          .then(() => klass)
      });

    return this.addAction(result, details);
  }

  assignPredicate(modelPromise: IPromise<Model>, predicatePromise: IPromise<Predicate>): IPromise<Predicate> {
    const result = this.loggedIn
      .then(() =>  this.$q.all([modelPromise, predicatePromise]))
      .then(([model, predicate]: [Model, Predicate]) => this.predicateService.assignPredicateToModel(predicate.id, model.id).then(() => predicate));

    return this.addAction(result, 'assign predicate');
  }

  createPredicate<T extends Predicate>(modelPromise: IPromise<Model>, type: Type, details: PredicateDetails, mangler: (predicate: T) => IPromise<any>): IPromise<T> {

    const concept = details.concept;
    const conceptIdPromise = isConceptSuggestion(concept)
      ? this.createConceptSuggestion(concept).then(conceptSuggestion => conceptSuggestion.id)
      : concept ? this.$q.when(new Uri(<string> concept)) : this.$q.when(asiaConceptId);

    const result = this.loggedIn
      .then(() =>  this.$q.all([modelPromise, conceptIdPromise]))
      .then(([model, conceptId]: [Model, Uri]) => this.predicateService.newPredicate(model, details.label['fi'], conceptId, type, 'fi'))
      .then((predicate: T) => {
        setDetails(predicate, details);
        setId(predicate, details);

        const promises: IPromise<any>[] = [];

        assertPropertyValueExists(details, 'subPropertyOf for ' + details.label['fi]']);
        promises.push(asUriPromise(details.subPropertyOf).then(uri => predicate.subPropertyOf = uri));

        for (const equivalentProperty of details.equivalentProperties || []) {
          promises.push(asUriPromise(assertExists(equivalentProperty, 'equivalent property for ' + details.label['fi'])).then(uri => predicate.equivalentProperties.push(uri)));
        }

        promises.push(mangler(predicate));

        return this.$q.all(promises)
          .then(() => this.predicateService.createPredicate(predicate))
          .then(() => predicate);
      });

    return this.addAction(result, details);
  }

  createAttribute(modelPromise: IPromise<Model>, details: AttributeDetails): IPromise<Attribute> {
    return this.createPredicate<Attribute>(modelPromise, 'attribute', details, attribute => {
      attribute.dataType = details.dataType;
      return this.$q.when();
    });
  }

  createAssociation(modelPromise: IPromise<Model>, details: AssociationDetails): IPromise<Association> {
    return this.createPredicate<Association>(modelPromise, 'association', details, association => {
      assertPropertyValueExists(details, 'valueClass');
      return asUriPromise(details.valueClass)
        .then(uri => association.valueClass = uri);
    });
  }

  createProperty(details: PropertyDetails): IPromise<Property> {
    const result = this.loggedIn
      .then(() =>  asPromise(assertExists(details.predicate, 'predicate')))
      .then(p => this.classService.newProperty(p.id))
      .then((p: Property) => {
        setDetails(p, details);
        assertPropertyValueExists(details, 'valueClass');
        const valueClassPromise = asUriPromise(details.valueClass).then(id => {
          if (id) {
            p.valueClass = id;
          }
        });

        if (details.dataType) {
          p.dataType = details.dataType;
        }

        p.example = details.example;
        p.minCount = details.minCount;
        p.maxCount = details.maxCount;
        p.pattern = details.pattern;

        return valueClassPromise.then(() => p);
      });

    return this.addAction(result, details);
  }
}

function failWithDetails(details: any): (err: any) => void {
  return (error: any) => {
    return Promise.reject({ error, details });
  }
}

function setDetails(entity: { label: Localizable, comment: Localizable, state: State }, details: EntityDetails) {
  entity.label = details.label;
  entity.comment = details.comment;
  if (details.state) {
    entity.state = details.state;
  }
}

function setId(entity: { id: Uri }, details: { id?: string }) {
  if (details.id) {
    entity.id = entity.id.withName(details.id);
  }
}

function assertPropertyValueExists(obj: any, property: string) {
  if (obj.hasOwnProperty(property)) {
    return assertExists(obj[property], ' property: ' + property);
  }

  return obj[property];
}

function assertExists<T>(obj: T, msg: string): T {
  if (obj === null || obj === undefined) {
    throw new Error('Null or undefined: ' + msg);
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

function isExternalRequire(obj: any): obj is ExternalRequireDetails {
  return !!obj.label && !!obj.namespace && !!obj.prefix;
}

function isUriResolvable<T>(obj: any): obj is UriResolvable<T> {
  return isPromiseProvider(obj) || isPromise(obj);
}

function asUriPromise<T extends { id: Uri }>(resolvable: UriResolvable<T>): IPromise<Uri> {
  if (isPromiseProvider(resolvable)) {
    const promise = resolvable();
    if (isPromise<T>(promise)) {
      return promise.then(withId => withId.id);
    } else {
      throw new Error('Must be promise');
    }
  } else if (isPromise(resolvable)) {
    return resolvable.then(withId => withId.id);
  } else if (typeof resolvable === 'string') {
    return <IPromise<Uri>> Promise.resolve(new Uri(resolvable));
  } else {
    return <IPromise<Uri>> Promise.resolve(null);
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
