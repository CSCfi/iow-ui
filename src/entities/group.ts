import { Language } from '../utils/language';
import { groupUrl } from '../utils/entity';
import { localizableSerializer, identitySerializer, optional } from './serializer/serializer';
import { Uri, Url } from '../entities/uri';
import { GroupType } from './type';
import { Localizable } from './contract';
import { init } from './mapping';
import { GraphNode } from './graphNode';
import { uriSerializer, entity, entityAwareList } from './serializer/entitySerializer';
import { Vocabulary } from './vocabulary';

export abstract class AbstractGroup extends GraphNode {

  static abstractGroupMapping = {
    id:           { name: '@id',        serializer: uriSerializer },
    label:        { name: 'label',      serializer: localizableSerializer },
    comment:      { name: 'comment',    serializer: localizableSerializer },
    homepage:     { name: 'homepage',   serializer: optional(identitySerializer<Url>()) },
    vocabularies: { name: 'references', serializer: entityAwareList(entity(() => Vocabulary)) }
  };

  id: Uri;
  label: Localizable;
  comment: Localizable;
  homepage: Url|null;
  vocabularies: Vocabulary[];
  normalizedType: GroupType = 'group';
  selectionType: GroupType = 'group';

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    init(this, AbstractGroup.abstractGroupMapping);
  }

  get groupId() {
    return this.id;
  }

  iowUrl() {
    return groupUrl(this.id.toString());
  }
}

export class GroupListItem extends AbstractGroup {
  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
  }
}

export class Group extends AbstractGroup {

  unsaved = false;
  language: Language[] = ['fi', 'en'];

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
  }

  clone(): Group {
    const serialization = this.serialize(false, true);
    const result =  new Group(serialization['@graph'], serialization['@context'], this.frame);
    result.unsaved = this.unsaved;
    return result;
  }
}
