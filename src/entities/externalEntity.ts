import { PredicateType, ClassType } from './type';
import { Language } from '../utils/language';
import { Uri } from '../services/uri';

export class ExternalEntity {

  id?: Uri;

  constructor(public language: Language, public label: string, public type: ClassType|PredicateType) {
  }

  get normalizedType() {
    return this.type;
  }
}
