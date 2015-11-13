const _ = require('lodash');
const utils = require('./utils');
const jsonld = require('jsonld');
const frames = require('./frames');

class GroupListItem {
  constructor(graph) {
    this.id = graph['@id'];
    this.label = graph.label;
    this.homepage = graph.homepage;
  }
}

class ModelListItem {
  constructor(graph) {
    this.id = graph['@id'];
    this.label = graph.label;
  }
}

class Model {
  constructor(graph, context) {
    this.graph = graph;
    this.context = context;
    this.id = graph['@id'];
    this.label = graph.label;
    this.comment = graph.comment;
    this.state = graph.versionInfo;
    this.references = mapAsEntity(context, graph.references, Reference, true);
    this.requires = mapAsEntity(context, graph.requires, Require, true);
  }

  get type() {
    return 'model';
  }

  addReference(reference) {
    this.references.push(reference);
  }

  removeReference(reference) {
    _.remove(this.references, reference);
  }

  serialize() {
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
    this.id = graph['@id'];
    this.title = graph.title;
    this.type = 'require';
    this.namespace = graph['dcap:preferredXMLNamespaceName'];
    this.prefix = graph['dcap:preferredXMLNamespacePrefix'];
    this.serialize = () => graph;
  }
}

class ClassListItem {
  constructor(graph, context) {
    this.id = graph['@id'];
    this.type = 'class';
    this.label = graph.label;
    this.comment = graph.comment;
    this.model = mapAsEntity(context, graph.isDefinedBy, ModelListItem, false);
  }
}

class Class {
  constructor(graph, context) {
    this.graph = graph;
    this.context = context;
    this.curie = graph['@id'];
    this.modelId = graph.isDefinedBy;
    this.label = graph.label;
    this.comment = graph.comment;
    this.subClassOf = graph.subClassOf;
    this.state = graph.versionInfo;
    this.properties = mapAsEntity(context, graph.property, Property, true);
    this.subject = mapAsEntity(context, graph.subject, Concept, false);
  }

  get id() {
    return withPrefixExpanded(this.context, this.curie);
  }

  get type() {
    return 'class';
  }

  addProperty(property) {
    this.properties.push(property);
  }

  removeProperty(property) {
    _.remove(this.properties, property);
  }

  glyphIconClass() {
    return utils.glyphIconClassForType('class');
  }

  isEqual(other) {
    return this.id === other.id && this.type === other.type;
  }

  isClass() {
    return true;
  }

  isPredicate() {
    return false;
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

  glyphIconClass() {
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
    function predicateTypeAsEntityType(type) {
      return type === 'owl:DatatypeProperty' ? 'attribute' : 'association';
    }
    this.graph = graph;
    this.context = context;
    this.type = predicateTypeAsEntityType(graph['@type']);
    this.label = graph.label;
    this.comment = graph.comment;
  }

  get owlType() {
    return this.graph['@type'];
  }

  isEqual(other) {
    return this.id === other.id && this.type === other.type;
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

  glyphIconClass() {
    return utils.glyphIconClassForType(this.type);
  }
}

class PredicateListItem extends AbstractPredicate {
  constructor(graph, context) {
    super(graph, context);
    this.id = graph['@id'];
    this.model = mapAsEntity(context, graph.isDefinedBy, ModelListItem, false);
  }
}

class Predicate extends AbstractPredicate {
  constructor(graph, context) {
    super(graph, context);
    this.curie = graph['@id'];
    this.modelId = graph.isDefinedBy;
    this.range = graph.range;
    this.state = graph.versionInfo;
    this.subject = mapAsEntity(context, graph.subject, Concept, false);
  }

  get id() {
    return withPrefixExpanded(this.context, this.curie);
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
    this.schemeId = graph.inScheme;
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
    this.name = graph.name;
  }

  isLoggedIn() {
    return this.graph['iow:login'];
  }

  isInGroup(group) {
    return this.graph.isPartOf === group;
  }

  isAdminOfGroup(group) {
    return this.graph.isAdminOf === group;
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

function withPrefixExpanded(context, value) {
  const parts = value.split(':');
  if (parts.length === 2) {
    const expansion = context[parts[0]];
    if (expansion) {
      return expansion + parts[1];
    }
  }
  return value;
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

module.exports = function entities($log) {
  'ngInject';

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
    deserializeConcept: (data) => new Concept(data),
    deserializeUser: (data) => frameAndMap(data, frames.userFrame, User, false),
    anonymousUser: () => new AnonymousUser()
  };
};
