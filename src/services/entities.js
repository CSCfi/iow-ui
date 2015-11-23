const _ = require('lodash');
const utils = require('./utils');
const jsonld = require('jsonld');
const frames = require('./frames');

module.exports = function entities($log, modelCache) {
  'ngInject';

  class GroupListItem {
    constructor(graph) {
      this.id = graph['@id'];
      this.label = graph.label;
      this.comment = graph.comment;
      this.homepage = graph.homepage;
      this.type = 'group';
    }

    get iowUrl() {
      return groupUrl(this.id);
    }
  }

  class AbstractModel {
    constructor(graph) {
      this.id = graph['@id'];
      this.label = graph.label;
      this.namespace = graph['dcap:preferredXMLNamespaceName'];
      this.prefix = graph['dcap:preferredXMLNamespacePrefix'];
      this.type = 'model';
    }

    get iowUrl() {
      return modelUrl(this.id);
    }

    get glyphIconClass() {
      return utils.glyphIconClassForType(this.type);
    }
  }

  class ModelListItem extends AbstractModel {
    constructor(graph) {
      super(graph);
    }
  }

  class Model extends AbstractModel {
    constructor(graph, context) {
      super(graph);
      this.graph = graph;
      this.context = context;
      this.comment = graph.comment;
      this.state = graph.versionInfo;
      this.references = mapAsEntity(context, graph.references, Reference, true);
      this.requires = mapAsEntity(context, graph.requires, Require, true);
      this.copyNamespacesFromRequires();
    }

    expandCurie(curie) {
      if (curie) {
        const {prefix, value} = splitCurie(curie);
        if (prefix) {
          return { namespace: this.context[prefix], value };
        }
      }
    }

    isCurieDefinedInModel(curie) {
      const { namespace } = this.expandCurie(curie);
      if (namespace) {
        return modelCache.modelIdForNamespace(namespace);
      }
    }

    linkToCurie(type, curie) {
      if (curie) {
        const {namespace, value} = this.expandCurie(curie);
        if (namespace) {
          const id = modelCache.modelIdForNamespace(namespace)
          if (type === 'external' && !id) {
            return namespace + value;
          } else if (type !== 'external' && id) {
            return selectableUrl(namespace + value, type);
          }
        }
      }
    }

    linkToExternalCurie(curie) {
      return this.linkToCurie('external', curie);
    }

    withPrefixExpanded(curie) {
      return withPrefixExpanded(this.context, curie);
    }

    addReference(reference) {
      this.references.push(reference);
    }

    removeReference(reference) {
      _.remove(this.references, reference);
    }

    addRequire(require) {
      this.requires.push(require);
    }

    removeRequire(require) {
      _.remove(this.requires, require);
    }

    copyNamespacesFromRequires() {
      _.forEach(this.requires, reference => {
        this.context[reference.prefix] = reference.namespace;
      });
    }

    serialize() {
      this.copyNamespacesFromRequires();
      return {
        '@context': this.context, '@graph': _.extend(this.graph,
          {
            label: this.label,
            comment: this.comment,
            versionInfo: this.state,
            references: _.map(this.references, reference => reference.serialize()),
            requires: _.map(this.requires, require => require.serialize())
          }
        )
      };
    }
  }

  class Reference {
    constructor(graph) {
      this.id = graph['@id'];
      this.title = graph.title;
      this.type = 'reference';
      this.vocabularyId = graph['dct:identifier'];
      this.serialize = () => graph;
    }
  }

  class Require {
    constructor(graph) {
      this.graph = graph;
      this.id = graph['@id'];
      this.label = graph.label;
      this.type = 'require';
      this._namespace = graph['dcap:preferredXMLNamespaceName'];
      this.prefix = graph['dcap:preferredXMLNamespacePrefix'];
    }

    get namespace() {
      return this._namespace;
    }

    set namespace(value) {
      this._namespace = value;
      this.id = _.trimRight(value, '#/');
    }

    serialize() {
      return _.extend(this.graph,
        {
          '@id': this.id,
          label: this.label,
          'dcap:preferredXMLNamespaceName': this.namespace,
          'dcap:preferredXMLNamespacePrefix': this.prefix
        }
      );
    }
  }

  class AbstractClass {
    constructor(graph) {
      this.type = 'class';
      this.label = graph.label;
      this.comment = graph.comment;
    }

    isEqual(other) {
      return other && this.id === other.id && this.type === other.type;
    }

    isClass() {
      return true;
    }

    isPredicate() {
      return false;
    }

    get glyphIconClass() {
      return utils.glyphIconClassForType(this.type);
    }

    get iowUrl() {
      return `${this.modelIowUrl}&${this.type}=${encodeURIComponent(this.id)}`;
    }
  }

  class ClassListItem extends AbstractClass {
    constructor(graph, context) {
      super(graph, context);
      this.id = graph['@id'];
      this.model = mapAsEntity(context, graph.isDefinedBy, ModelListItem, false);
    }

    get modelIowUrl() {
      return this.model.iowUrl();
    }
  }

  class Class extends AbstractClass {
    constructor(graph, context) {
      super(graph);
      this.graph = graph;
      this.context = context;
      this.curie = graph['@id'];
      this.modelId = graph.isDefinedBy;
      this.subClassOf = graph.subClassOf;
      this.state = graph.versionInfo;
      this.properties = mapAsEntity(context, graph.property, Property, true);
      this.subject = mapAsEntity(context, graph.subject, Concept, false);
    }

    get id() {
      return withPrefixExpanded(this.context, this.curie);
    }

    addProperty(property) {
      this.properties.push(property);
    }

    removeProperty(property) {
      _.remove(this.properties, property);
    }

    get modelIowUrl() {
      return modelUrl(this.modelId);
    }

    serialize() {
      return {
        '@context': this.context, '@graph': _.extend(this.graph,
          {
            '@id': this.id,
            label: this.label,
            comment: this.comment,
            subClassOf: this.subClassOf,
            versionInfo: this.state,
            property: _.map(this.properties, property => property.serialize()),
            subject: this.subject && this.subject.serialize()
          }
        )
      };
    }
  }

  class Property {
    constructor(graph, context) {
      this.graph = graph;
      this.context = context;
      this.id = graph['@id'];
      this.label = graph.label;
      this.comment = graph.comment;
      this.example = graph.example;
      this.dataType = graph.datatype;
      this.valueClass = graph.valueClass;
      this.predicateCurie = graph.predicate;
    }

    get type() {
      return 'property';
    }

    get predicateId() {
      return withPrefixExpanded(this.context, this.predicateCurie);
    }

    get glyphIconClass() {
      return utils.glyphIconClassForType(this.dataType ? 'attribute' : this.valueClass ? 'association' : null);
    }

    serialize() {
      return _.extend(this.graph,
        {
          label: this.label,
          comment: this.comment,
          example: this.example,
          datatype: this.dataType,
          valueClass: this.valueClass,
          predicate: this.predicateCurie
        });
    }
  }

  class AbstractPredicate {
    constructor(graph, context) {
      this.graph = graph;
      this.context = context;
      this.type = graph['@type'] === 'owl:DatatypeProperty' ? 'attribute' : 'association';
      this.label = graph.label;
      this.comment = graph.comment;
    }

    get owlType() {
      return this.graph['@type'];
    }

    isEqual(other) {
      return other && this.id === other.id && this.type === other.type;
    }

    isClass() {
      return false;
    }

    isPredicate() {
      return true;
    }

    isAssociation() {
      return this.type === 'association';
    }

    isAttribute() {
      return this.type === 'attribute';
    }

    get glyphIconClass() {
      return utils.glyphIconClassForType(this.type);
    }

    get iowUrl() {
      return `${this.modelIowUrl}&${this.type}=${encodeURIComponent(this.id)}`;
    }
  }

  class PredicateListItem extends AbstractPredicate {
    constructor(graph, context) {
      super(graph, context);
      this.id = graph['@id'];
      this.model = mapAsEntity(context, graph.isDefinedBy, ModelListItem, false);
    }

    get modelIowUrl() {
      return this.model.iowUrl();
    }
  }

  class Predicate extends AbstractPredicate {
    constructor(graph, context) {
      super(graph, context);
      this.curie = graph['@id'];
      this.modelId = graph.isDefinedBy;
      this.range = graph.range;
      this.state = graph.versionInfo;
      this.subPropertyOf = graph.subPropertyOf;
      this.subject = mapAsEntity(context, graph.subject, Concept, false);
    }

    get id() {
      return withPrefixExpanded(this.context, this.curie);
    }

    get modelIowUrl() {
      return modelUrl(this.modelId);
    }

    serialize() {
      return {
        '@context': this.context, '@graph': _.extend(this.graph,
          {
            '@id': this.id,
            label: this.label,
            comment: this.comment,
            range: this.range,
            versionInfo: this.state,
            subPropertyOf: this.subPropertyOf,
            subject: this.subject && this.subject.serialize()
          }
        )
      };
    }
  }

  class ConceptSuggestion {
    constructor(graph) {
      this.id = graph['@id'];
      this.label = graph.label;
      this.comment = graph.comment;
      this.schemeId = graph.inScheme['@id'];
      this.createdAt = graph.atTime;
      this.creator = graph.wasAssociatedWith;
      this.type = 'conceptSuggestion';
      this.serialize = () => (graph);
    }
  }

  class Concept {
    constructor(graph) {
      this.id = graph['@id'];
      this.label = graph.prefLabel;
      this.comment = graph.comment;
      this.schemeId = graph.inScheme;
      this.type = 'concept';
      this.serialize = () => (graph);
    }
  }

  class User {
    constructor(graph) {
      this.graph = graph;
      this.id = graph['@id'];
      this.type = 'person';
      this.createdAt = graph.created;
      this.modifiedAt = graph.modified;
      this.isAdminOf = graph.isAdminOf;
      this.isPartOf = graph.isPartOf;
      this.name = graph.name;
    }

    isLoggedIn() {
      return this.graph['iow:login'];
    }

    isInGroup(groupId) {
      return _.find(utils.normalizeAsArray(this.graph.isPartOf), groupId);
    }

    isAdminOfGroup(groupId) {
      return _.find(utils.normalizeAsArray(this.graph.isAdminOf), groupId);
    }
  }

  class AnonymousUser {
    constructor() {
      this.type = 'person';
      this.name = 'Anonymous';
    }

    isLoggedIn() {
      return false;
    }

    isInGroup() {
      return false;
    }

    isAdminOfGroup() {
      return false;
    }
  }

  class SearchResult {
    constructor(graph) {
      this.graph = graph;
      this.id = graph['@id'];
      this.label = graph.label;
      this.comment = graph.comment;
      this.type = mapType(graph['@type']);
    }

    get iowUrl() {
      switch (this.type) {
        case 'group':
          return groupUrl(this.id);
        case 'model':
          return modelUrl(this.id);
        default:
          if (this.type) {
            return selectableUrl(this.id, this.type);
          }
      }
    }

    get glyphIconClass() {
      return utils.glyphIconClassForType(this.type);
    }
  }

  function mapType(type) {
    for (const item of utils.normalizeAsArray(type)) {
      switch (item) {
        case 'sh:ShapeClass':
          return 'class';
        case 'owl:DatatypeProperty':
          return 'attribute';
        case 'owl:ObjectProperty':
          return 'association';
        case 'owl:Ontology':
          return 'model';
        case 'foaf:Group':
          return 'group';
        default:
          // continue
      }
    }
  }

  function groupUrl(id) {
    return `/groups?urn=${encodeURIComponent(id)}`;
  }

  function modelUrl(id) {
    return `/models?urn=${encodeURIComponent(id)}`;
  }

  function selectableUrl(id, type) {
    const [modelId] = id.split('#');
    return `${modelUrl(modelId)}&${type}=${encodeURIComponent(id)}`;
  }

  function splitCurie(curie) {
    const parts = curie.split(':');
    if (parts.length === 2) {
      return {prefix: parts[0], value: parts[1]};
    }

    return {};
  }

  function withPrefixExpanded(context, uri) {
    const {prefix, value} = splitCurie(uri);
    if (prefix) {
      const expansion = context[prefix];
      if (expansion) {
        return expansion + value;
      }
    }
    return uri;
  }

  function renameProperty(obj, name, newName) {
    obj[newName] = obj[name];
    delete obj[name];
    return obj;
  }

  function mapAsEntity(context, graph, EntityConstructor, isArray) {
    if (Array.isArray(graph)) {
      const mapped = _.map(graph, element => new EntityConstructor(element, context));
      return isArray ? mapped : mapped[0];
    } else if (typeof graph === 'object') {
      const entity = new EntityConstructor(graph, context);
      return isArray ? [entity] : entity;
    } else {
      return isArray ? [] : null;
    }
  }


  function frameData(data, frameFn) {
    return jsonld.promises.frame(data, frameFn(data));
  }

  function frameAndMap(data, frame, entityConstructor, isArray) {
    return frameData(data, frame)
      .then(framed => {
        return mapAsEntity(framed['@context'], framed['@graph'], entityConstructor, isArray);
      }, err => {
        $log.error(err.message);
        $log.error(err.details.cause);
      });
  }

  return {
    deserializeGroupList: (data) => frameAndMap(data, frames.groupListFrame, GroupListItem, true),
    deserializeModelList: (data) => frameAndMap(data, frames.modelListFrame, ModelListItem, true),
    deserializeModel: (data) => frameAndMap(data, frames.modelFrame, Model, false),
    deserializeClassList: (data) => frameAndMap(data, frames.classListFrame, ClassListItem, true),
    deserializeClass: (data) => frameAndMap(data, frames.classFrame, Class, false),
    deserializeProperty: (data) => frameAndMap(data, frames.propertyFrame, Property, false),
    deserializePredicateList: (data) => frameAndMap(data, frames.predicateListFrame, PredicateListItem, true),
    deserializePredicate: (data) => frameAndMap(data, frames.predicateFrame, Predicate, false),
    deserializeReference: (data) => new Reference(data),
    deserializeConceptSuggestion: (data) => frameAndMap(data, frames.conceptSuggestionFrame, ConceptSuggestion, false),
    deserializeConceptSuggestions: (data) => frameAndMap(data, frames.conceptSuggestionFrame, ConceptSuggestion, true),
    // TODO: something less hacky?
    deserializeConcept: (data, id) => jsonld.promises.frame(data, frames.fintoConceptFrame(data, id))
      .then(framed => mapAsEntity(framed['@context'], renameProperty(framed.graph[0], 'uri', '@id'), Concept, false)),
    deserializeRequire: (data) => frameAndMap(data, frames.requireFrame, Require, false),
    deserializeRequires: (data) => frameAndMap(data, frames.requireFrame, Require, true),
    deserializeUser: (data) => frameAndMap(data, frames.userFrame, User, false),
    anonymousUser: () => new AnonymousUser(),
    deserializeSearch: (data) => frameAndMap(data, frames.searchResultFrame, SearchResult, true),
    deserializeClassVisualization: (data) => frameData(data, frames.classVisualizationFrame)
  };
};
