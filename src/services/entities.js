const _ = require('lodash');
const utils = require('./utils');
const jsonld = require('jsonld');
const frames = require('./frames');

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

class GroupList {
  constructor(graph) {
    this.id = graph['@id'];
    this.label = graph.label;
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
    this.label = graph.label;
    this.comment = graph.comment;
    this.references = mapAsEntity(context, graph.references, Reference, true);
    this.requires = mapAsEntity(context, graph.requires, Require, true);
  }

  get id() {
    return withPrefixExpanded(this.context, this.graph['@id']);
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

  clone() {
    const model = new Model(this.graph, this.context);
    _.extend(model.label, this.label);
    _.extend(model.comment, this.comment);
    _.extend(model.references, this.references.slice());
    _.extend(model.requires, this.requires.slice());
    return model;
  }

  serialize() {
    return {
      '@context': this.context, '@graph': _.extend(this.graph,
        {
          label: this.label,
          comment: this.comment,
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
    this.idName = graph['@id'];
    this.modelId = graph.isDefinedBy;
    this.label = graph.label;
    this.comment = graph.comment;
    this.subClassOf = graph.subClassOf;
    this.properties = mapAsEntity(context, graph.property, Property, true);
  }

  get id() {
    return withPrefixExpanded(this.context, this.idName);
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

  clone() {
    const klass = new Class(this.graph, this.context);
    _.extend(klass.idName, this.idName);
    _.extend(klass.label, this.label);
    _.extend(klass.comment, this.comment);
    _.extend(klass.subClassOf, this.subClassOf);
    _.extend(klass.properties, _.map(this.properties, property => property.clone()));
    return klass;
  }

  serialize() {
    return {
      '@context': this.context, '@graph': _.extend(this.graph,
        {
          '@id': this.id,
          label: this.label,
          comment: this.comment,
          subClassOf: this.subClassOf,
          property: _.map(this.properties, property => property.serialize())
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
    this.predicateIdName = graph.predicate;
  }

  get type() {
    return 'property';
  }

  get predicateId() {
    return withPrefixExpanded(this.context, this.predicateIdName);
  }

  glyphIconClass() {
    return utils.glyphIconClassForType(this.dataType ? 'attribute' : this.valueClass ? 'association' : null);
  }

  clone() {
    const property = new Property(this.graph, this.context);
    _.extend(property.label, this.label);
    _.extend(property.comment, this.comment);
    _.extend(property.example, this.example);
    _.extend(property.datatype, this.dataType);
    _.extend(property.valueClass, this.valueClass);
    _.extend(property.predicate, this.predicateIdName);
    return property;
  }

  serialize() {
    return _.extend(this.graph,
      {
        label: this.label,
        comment: this.comment,
        example: this.example,
        datatype: this.dataType,
        valueClass: this.valueClass,
        predicate: this.predicateIdName
      });
  }
}

function predicateTypeAsEntityType(type) {
  return type === 'owl:DatatypeProperty' ? 'attribute' : 'association';
}

class PredicateListItem {
  constructor(graph, context) {
    this.id = graph['@id'];
    this.type = predicateTypeAsEntityType(graph['@type']);
    this.label = graph.label;
    this.comment = graph.comment;
    this.model = mapAsEntity(context, graph.isDefinedBy, ModelListItem, false);
  }

  isAssociation() {
    return this.type === 'association';
  }

  isAttribute() {
    return this.type === 'attribute';
  }
}

class Predicate {
  constructor(graph, context) {
    this.graph = graph;
    this.context = context;
    this.idName = graph['@id'];
    this.modelId = graph.isDefinedBy;
    this.label = graph.label;
    this.comment = graph.comment;
    this.range = graph.range;
  }

  get id() {
    return withPrefixExpanded(this.context, this.idName);
  }

  get owlType() {
    return this.graph['@type'];
  }

  get type() {
    return predicateTypeAsEntityType(this.owlType);
  }

  glyphIconClass() {
    return utils.glyphIconClassForType(this.type);
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

  clone() {
    const predicate = new Predicate(this.graph, this.context);
    predicate.idName = this.idName;
    predicate.label = this.label;
    predicate.comment = this.comment;
    predicate.range = this.range;
    return predicate;
  }

  serialize() {
    return {
      '@context': this.context, '@graph': _.extend(this.graph,
        {
          '@id': this.id,
          label: this.label,
          comment: this.comment,
          range: this.range
        }
      )
    };
  }
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
    });
}

module.exports = function entities() {
  return {
    deserializeGroupList: (data) => frameAndMap(data, frames.groupListFrame, GroupList, true),
    deserializeModelList: (data) => frameAndMap(data, frames.modelListFrame, ModelListItem, true),
    deserializeModel: (data) => frameAndMap(data, frames.modelFrame, Model, false),
    deserializeClassList: (data) => frameAndMap(data, frames.classListFrame, ClassListItem, true),
    deserializeClass: (data) => frameAndMap(data, frames.classFrame, Class, false),
    deserializeProperty: (data) => frameAndMap(data, frames.propertyFrame, Property, false),
    deserializePredicateList: (data) => frameAndMap(data, frames.predicateListFrame, PredicateListItem, true),
    deserializePredicate: (data) => frameAndMap(data, frames.predicateFrame, Predicate, false),
    Reference
  };
};
