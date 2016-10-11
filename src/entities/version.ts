import { Uri } from '../entities/uri';
import { UserLogin } from './contract';
import { Moment } from 'moment';
import { requireDefined } from '../utils/object';
import { idToIndexMap } from '../utils/entity';
import { comparingDate } from '../services/comparators';
import { init } from './mapping';
import { GraphNode } from './graphNode';
import { uriSerializer, entityAwareList, entity, entityAwareOptional } from './serializer/entitySerializer';
import { dateSerializer, userLoginSerializer } from './serializer/serializer';

export class Activity extends GraphNode {

  static activityMappings = {
    id: { name: '@id', serializer: uriSerializer },
    createdAt: { name: 'startedAtTime', serializer: dateSerializer },
    lastModifiedBy: { name: 'wasAttributedTo', serializer: userLoginSerializer },
    versions: { name: 'generated', serializer: entityAwareList(entity(() => Entity)) },
    latestVersion: { name: 'used', serializer: uriSerializer }
  };

  id: Uri;
  createdAt: Moment;
  lastModifiedBy: UserLogin;
  versions: Entity[];
  latestVersion: Uri;
  private versionIndex: Map<string, number>;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    init(this, Activity.activityMappings);
    this.versions = this.versions.sort(comparingDate<Entity>(entity => entity.createdAt));
    this.versionIndex = idToIndexMap(this.versions);
  }

  getVersion(version: Uri): Entity {
    const index = this.versionIndex.get(version.toString());
    return requireDefined(index ? this.versions[index] : null);
  }

  get latest(): Entity {
    return this.getVersion(this.latestVersion);
  }
}

export class Entity extends GraphNode {

  static entityMappings = {
    id:              { name: '@id',             serializer: uriSerializer },
    createdAt:       { name: 'generatedAtTime', serializer: dateSerializer },
    createdBy:       { name: 'wasAttributedTo', serializer: userLoginSerializer },
    previousVersion: { name: 'wasRevisionOf',   serializer: entityAwareOptional(uriSerializer) }
  };

  id: Uri;
  createdAt: Moment;
  createdBy: UserLogin;
  previousVersion: Uri|null;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    init(this, Entity.entityMappings);
  }

  getPrevious(activity: Activity): Entity|null {
    return this.previousVersion ? activity.getVersion(this.previousVersion) : null;
  }
}
