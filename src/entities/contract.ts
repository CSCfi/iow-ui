import { Type } from './type';
import { Uri } from '../services/uri';
import { Language, availableUILanguages } from '../utils/language';
import { GraphNode, GraphNodes } from './graphNode';

export const frontPageSearchLanguageContext: LanguageContext = {
  id: new Uri('http://iow/frontpage', {}),
  language: availableUILanguages
};

export interface LanguageContext {
  id: Uri;
  language: Language[];
}

// TODO: type language indexer as Language when typescript supports it https://github.com/Microsoft/TypeScript/issues/5683
export type Localizable = { [language: string]: string; }
export type UserLogin = string;
export type Coordinate = { x: number, y: number };
export type Dimensions = { width: number, height: number };

export type GraphData = {
  '@context': any;
  '@graph': any;
}

export interface EntityConstructor<T extends GraphNode> {
  new(graph: any, context: any, frame: any): T;
}

export interface EntityArrayConstructor<T extends GraphNode, A extends GraphNodes<T>> {
  new(graph: any[], context: any, frame: any): A;
}

export type EntityFactory<T extends GraphNode> = (framedData: any) => EntityConstructor<T>;
export type EntityArrayFactory<T extends GraphNode, A extends GraphNodes<T>> = (framedData: any) => EntityArrayConstructor<T, A>;

export interface EditableEntity {
  id: Uri;
  label: Localizable;
  normalizedType: Type;
  isOfType(type: Type): boolean;
  unsaved: boolean;
  clone<T>(): T;
  serialize<T>(): T;
}
