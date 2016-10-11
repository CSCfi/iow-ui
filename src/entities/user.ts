import { AbstractGroup } from './group';
import { Uri } from '../services/uri';
import { UserLogin } from './contract';
import { Moment } from 'moment';
import { dateSerializer, optional, userLoginSerializer, stringSerializer } from './serializer/serializer';
import { Model, AbstractModel } from './model';
import { contains } from '../utils/array';
import { init } from './mapping';
import { GraphNode } from './graphNode';
import { entityAwareList, uriSerializer } from './serializer/entitySerializer';

export interface User {
  isLoggedIn(): boolean;
  isMemberOf(entity: AbstractModel|AbstractGroup): boolean;
  isMemberOfGroup(id: Uri): boolean;
  isAdminOf(entity: AbstractModel|AbstractGroup): boolean;
  isAdminOfGroup(id: Uri): boolean;
  name: string|null;
}

export class DefaultUser extends GraphNode implements User {

  static defaultUserMapping = {
    createdAt: { name: 'created', serializer: dateSerializer },
    modifierAt: { name: 'modified', serializer: optional(dateSerializer) },
    adminGroups: { name: 'isAdminOf', serializer: entityAwareList(uriSerializer) },
    memberGroups: { name: 'isPartOf', serializer: entityAwareList(uriSerializer) },
    name: { name: 'name', serializer: optional(stringSerializer) },
    login: { name: '@id', serializer: userLoginSerializer }
  };

  createdAt: Moment;
  modifiedAt: Moment|null;
  adminGroups: Uri[];
  memberGroups: Uri[];
  name: string|null;
  login: UserLogin;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    init(this, DefaultUser.defaultUserMapping);
  }

  isLoggedIn(): boolean {
    return this.graph['iow:login'];
  }

  isMemberOf(entity: Model|AbstractGroup) {
    return this.isMemberOfGroup(entity.groupId);
  }

  isMemberOfGroup(id: Uri) {
    return contains(this.memberGroups, id, (lhs, rhs) => lhs.equals(rhs));
  }

  isAdminOf(entity: Model|AbstractGroup) {
    return this.isAdminOfGroup(entity.groupId);
  }

  isAdminOfGroup(id: Uri) {
    return contains(this.adminGroups, id, (lhs, rhs) => lhs.equals(rhs));
  }
}

export class AnonymousUser implements User {
  get name() {
    return null;
  }

  isLoggedIn(): boolean {
    return false;
  }

  isMemberOf(_entity: Model|AbstractGroup) {
    return false;
  }

  isMemberOfGroup(_id: Uri) {
    return false;
  }

  isAdminOf(_entity: Model|AbstractGroup) {
    return false;
  }

  isAdminOfGroup(_id: Uri) {
    return false;
  }
}
