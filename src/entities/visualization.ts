import { Uri } from '../entities/uri';
import { Type } from './type';
import { Localizable, Coordinate } from './contract';
import {  localizableSerializer, optional, coordinateSerializer, list, typeSerializer } from './serializer/serializer';
import { createConstantLocalizable } from '../utils/language';
import { Model } from './model';
import { copyVertices, coordinatesAreEqual, copyCoordinate, indexById } from '../utils/entity';
import { arraysAreEqual } from '../utils/array';
import { areEqual, isDefined } from '../utils/object';
import { Iterable } from '../utils/iterable';
import { Property } from './class';
import { init, serialize } from './mapping';
import { GraphNode, GraphNodes } from './graphNode';
import { uriSerializer, entityAwareOptional, entityAwareList, entity, entityAwareMap } from './serializer/entitySerializer';

export interface VisualizationClass {

  id: Uri;
  type: Type[];
  label: Localizable;
  comment: Localizable;
  scopeClass: Uri|null;
  properties: Property[];
  resolved: boolean;
  associationPropertiesWithTarget: Property[];
  hasAssociationTarget(id: Uri): boolean;
}

export class DefaultVisualizationClass extends GraphNode implements VisualizationClass {

  static defaultVisualizationClassMappings = {
    id:         { name: '@id',        serializer: uriSerializer },
    label:      { name: 'label',      serializer: localizableSerializer },
    comment:    { name: 'comment',    serializer: localizableSerializer },
    scopeClass: { name: 'scopeClass', serializer: entityAwareOptional(uriSerializer) },
    properties: { name: 'property',   serializer: entityAwareList(entity(() => Property)) }
  };

  id: Uri;
  label: Localizable;
  comment: Localizable;
  scopeClass: Uri|null;
  properties: Property[];
  resolved = true;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    init(this, DefaultVisualizationClass.defaultVisualizationClassMappings);
  }

  get associationPropertiesWithTarget() {
    return this.properties.filter(property => property.isAssociation() && property.valueClass);
  }

  hasAssociationTarget(id: Uri) {
    for (const association of this.associationPropertiesWithTarget) {
      if (association.valueClass!.equals(id)) {
        return true;
      }
    }
    return false;
  }
}

export class ModelPositions extends GraphNodes<ClassPosition> {

  private classes: Map<string, ClassPosition>;

  private dirty = false;
  private listeners: (() => void)[] = [];

  constructor(graph: any[], context: any, frame: any) {
    super(context, frame);
    this.classes = indexById(entityAwareList(entity(() => ClassPosition)).deserialize(graph, this));
    this.classes.forEach(c => c.parent = this);
  }

  getNodes() {
    return Array.from(this.classes.values());
  }

  addChangeListener(listener: () => void) {
    this.listeners.push(listener);
  }

  setPristine() {
    this.dirty = false;
  }

  setDirty() {
    const wasPristine = !this.dirty;
    this.dirty = true;

    if (wasPristine) {
      this.listeners.forEach(l => l());
    }
  }

  isPristine() {
    return !this.dirty;
  }

  clear() {
    Iterable.forEach(this.classes.values(), c => c.clear());
  }

  resetWith(resetWithPosition: ModelPositions) {

    Iterable.forEach(resetWithPosition.classes.values(), classPosition => {
      const klass = this.classes.get(classPosition.id.toString());
      if (klass) {
        klass.resetWith(classPosition);
      }
    });

    Iterable.forEach(this.classes.values(), classPosition => {
      if (!resetWithPosition.classes.has(classPosition.id.toString())) {
        classPosition.clear();
      }
    });

    this.setPristine();
  }

  changeClassId(oldClassId: Uri, newClassId: Uri) {
    const classPosition = this.getClass(oldClassId);
    classPosition.id = newClassId;
    this.classes.delete(oldClassId.uri);
    this.classes.set(newClassId.uri, classPosition);
  }

  removeClass(classId: Uri) {
    this.getClass(classId).clear();
  }

  isClassDefined(classId: Uri) {
    const classPosition = this.classes.get(classId.uri);
    return classPosition && classPosition.isDefined();
  }

  getClass(classId: Uri) {
    const classPosition = this.classes.get(classId.uri);
    if (classPosition) {
      return classPosition;
    } else {
      return this.newClassPosition(classId);
    }
  }

  getAssociationProperty(classId: Uri, associationPropertyInternalId: Uri) {
    return this.getClass(classId).getAssociationProperty(associationPropertyInternalId);
  }

  private newClassPosition(classId: Uri) {
    const position =  new ClassPosition({ '@id': classId.uri, '@type': typeSerializer.serialize(['class']) }, this.context, this.frame);
    position.parent = this;
    this.classes.set(classId.uri, position);
    return position;
  }

  clone() {
    const serialization = this.serialize(false, true);
    return new ModelPositions(serialization['@graph'], serialization['@context'], this.frame);
  }
}

export class ClassPosition extends GraphNode {

  static classPositionMappings = {
    id:                    { name: '@id',      serializer: uriSerializer },
    _coordinate:           { name: 'pointXY',  serializer: optional(coordinateSerializer) },
    associationProperties: { name: 'property', serializer: entityAwareMap(entity(() => AssociationPropertyPosition))}
  };

  id: Uri;
  private _coordinate: Coordinate|null;
  associationProperties: Map<string, AssociationPropertyPosition>;

  parent: ModelPositions;
  changeListeners: ((coordinate: Coordinate|null) => void)[] = [];

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    init(this, ClassPosition.classPositionMappings);
    this.associationProperties.forEach(p => p.parent = this);
  }

  get coordinate() {
    return this._coordinate;
  }

  setCoordinate(value: Coordinate|null, notify: boolean = true) {
    if (!areEqual(this.coordinate, value, coordinatesAreEqual)) {
      this.setDirty();
    }
    this._coordinate = value;

    if (notify) {
      this.changeListeners.forEach(l => l(value));
    }
  }

  setDirty() {
    if (this.parent) {
      this.parent.setDirty();
    }
  }

  clear() {
    Iterable.forEach(this.associationProperties.values(), p => p.clear());
    this.setCoordinate(null, false);
  }

  resetWith(resetWithPosition: ClassPosition) {
    if (resetWithPosition.isDefined()) {

      Iterable.forEach(resetWithPosition.associationProperties.values(), associationPropertyPosition => {
        const association = this.associationProperties.get(associationPropertyPosition.id.toString());
        if (association) {
          association.resetWith(associationPropertyPosition);
        }
      });

      Iterable.forEach(this.associationProperties.values(), associationPropertyPosition => {
        if (!resetWithPosition.associationProperties.has(associationPropertyPosition.id.toString())) {
          associationPropertyPosition.clear();
        }
      });

      this.setCoordinate(copyCoordinate(resetWithPosition.coordinate));
    }
  }

  isDefined() {
    return isDefined(this.coordinate);
  }

  getAssociationProperty(associationPropertyInternalId: Uri) {

    const associationPosition = this.associationProperties.get(associationPropertyInternalId.uri);

    if (associationPosition) {
      return associationPosition;
    } else {
      return this.newAssociationPosition(associationPropertyInternalId);
    }
  }

  private newAssociationPosition(associationPropertyInternalId: Uri) {
    const position = new AssociationPropertyPosition({ '@id': associationPropertyInternalId.uri }, this.context, this.frame);
    position.parent = this;
    this.associationProperties.set(associationPropertyInternalId.uri, position);
    return position;
  }

  serializationValues(_inline: boolean, clone: boolean): {} {
    return serialize(this, clone, ClassPosition.classPositionMappings);
  }
}

export class AssociationPropertyPosition extends GraphNode {

  static associationPropertyPositionMappings = {
    id:        { name: '@id',      serializer: uriSerializer },
    _vertices: { name: 'vertexXY', serializer: list(coordinateSerializer) }
  };

  id: Uri;
  _vertices: Coordinate[];

  parent: ClassPosition;
  changeListeners: ((vertices: Coordinate[]) => void)[] = [];

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    init(this, AssociationPropertyPosition.associationPropertyPositionMappings);
  }

  get vertices() {
    return this._vertices;
  }

  setVertices(value: Coordinate[], notify: boolean = true) {
    if (!arraysAreEqual(this.vertices, value, coordinatesAreEqual)) {
      this.setDirty();
    }
    this._vertices = value;

    if (notify) {
      this.changeListeners.forEach(l => l(value));
    }
  }

  setDirty() {
    if (this.parent) {
      this.parent.setDirty();
    }
  }

  clear() {
    this.setVertices([], false);
  }

  resetWith(resetWithPosition: AssociationPropertyPosition) {
    if (resetWithPosition.isDefined()) {
      this.setVertices(copyVertices(resetWithPosition.vertices));
    }
  }

  isDefined() {
    return this.vertices.length > 0;
  }

  serializationValues(_inline: boolean, clone: boolean): {} {
    return serialize(this, clone, AssociationPropertyPosition.associationPropertyPositionMappings);
  }
}

export class AssociationTargetPlaceholderClass implements VisualizationClass {

  label: Localizable;
  comment: Localizable = {};
  type: Type[] = ['association'];
  properties: Property[] = [];
  resolved = false;
  scopeClass: Uri|null = null;
  associationPropertiesWithTarget: Property[] = [];

  constructor(public id: Uri, model: Model) {
    this.label = createConstantLocalizable(id.compact, model.language);
  }

  hasAssociationTarget(_id: Uri) {
    return false;
  }
}
