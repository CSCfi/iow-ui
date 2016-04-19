import INgModelController = angular.INgModelController;
import { Type, Localizable, Model, DefinedBy, ClassListItem, GraphData } from './entities';
import { Uri } from './uri';
import { Language } from '../components/contracts';


export const availableLanguages: Language[] = ['fi', 'en'];

export function translate(data: Localizable, language: Language): string {
  function localized(lang: Language, showLang: boolean): string {
    let localization = data[lang];

    if (Array.isArray(localization)) {
      localization = Array.join(localization, ' ');
    }

    if (!localization) {
      return '';
    } else {
      return localization + (showLang ? ` (${lang})` : '');
    }
  }

  if (!data) {
    return '';
  }

  return localized(language, false) || _.find(_.map(availableLanguages, lang => localized(lang, true)), _.identity) || '';
}


export function extendNgModelOptions(ngModel: INgModelController, options: any) {
  if (ngModel.$options) {
    Object.assign(ngModel.$options, options);
  } else {
    ngModel.$options = options;
  }
}

export function allLocalizations(predicate: (localized: string) => boolean, localizable: Localizable) {
  if (localizable) {
    for (let localized of Object.values(localizable)) {
      if (!predicate(localized)) {
        return false;
      }
    }
  }
  return true;
}

export function anyLocalization(predicate: (localized: string) => boolean, localizable: Localizable) {
  if (localizable) {
    for (let localized of Object.values(localizable)) {
      if (predicate(localized)) {
        return true;
      }
    }
  }
  return false;
}

export namespace Iterable {
  export function forEach<T>(iterable: Iterable<T>, callback: (item: T) => void): void {
    const iterator = iterable[Symbol.iterator]();
    for (let next = iterator.next(); next.value !== undefined; next = iterator.next()) {
      callback(next.value);
    }
  }
}

export function expandContextWithKnownModels(model?: Model): (response: angular.IHttpPromiseCallbackArg<GraphData>) => angular.IHttpPromiseCallbackArg<GraphData> {
  return (response: angular.IHttpPromiseCallbackArg<GraphData>) => {
    if (model) {
      model.expandContextWithKnownModels(response.data['@context']);
    }
    return response;
  };
}

export enum SearchClassType {
  Class, Shape, SpecializedClass
}

interface WithId {
  id: Uri|string;
}

interface WithDefinedBy {
  definedBy: DefinedBy;
}

export function isDefined(obj: any): boolean {
  return obj !== null && obj !== undefined;
}

export function isString(str: any): str is string {
  return typeof str === 'string';
}

export function isNumber(str: any): str is number {
  return typeof str === 'number';
}

export function containsAny<T>(arr: T[], values: T[]): boolean {
  return findFirstMatching(arr, values) !== null;
}

export function findFirstMatching<T>(arr: T[], values: T[]): T {
  for (const value of values) {
    for (const item of arr) {
      if (item === value) {
        return item;
      }
    }
  }
  return null;
}

export function identity<T>(obj: T): T {
  return obj;
}

export function glyphIconClassForType(type: Type[]) {
  return [
    'glyphicon',
    {
      'glyphicon-list-alt': containsAny(type, ['class', 'shape']),
      'glyphicon-tasks': containsAny(type, ['attribute']),
      'glyphicon-sort': containsAny(type, ['association']),
      'glyphicon-book': containsAny(type, ['model', 'profile']),
      'glyphicon-question-sign': !type || type.length === 0 || containsAny(type, ['property'])
    }
  ];
}

export function normalizeAsArray<T>(obj: T|T[]): T[] {
  return Array.isArray(obj) ? obj : isDefined(obj) ? [obj] : [];
}

export function combineExclusions<T>(...excludes: ((item: T) => string)[]) {
  return (item: T) => {
    for (const exclude of excludes) {
      const result = exclude(item);
      if (result) {
        return result;
      }
    }
    return null;
  };
}

interface WithIdAndType {
  id: Uri;
  type: Type[];
}

function arraysAreEqual<T>(lhs: T[], rhs: T[]) {

  function rhsContains(item: T) {
    for (const r of rhs) {
      if (r === item) {
        return true;
      }
    }

    return false;
  }

  for (const l of lhs) {
    if (rhsContains(l)) {
      return true;
    }
  }

  return false;
}

export function createSelfExclusion(self: WithIdAndType) {
  return (item: WithIdAndType) => {
    if (arraysAreEqual(self.type, item.type) && self.id.equals(item.id)) {
      return 'Self reference not allowed';
    } else {
      return null;
    }
  };
}

export function createDefinedByExclusion(model: Model) {

  const modelIds = collectIds(model.requires);
  modelIds.add(model.id.uri);

  return (item: WithDefinedBy) => {
    if (!modelIds.has(item.definedBy.id.uri)) {
      return 'Not required by model';
    } else {
      return null;
    }
  };
}

export function createExistsExclusion(itemIds: Set<string>) {
  return (item: WithId) => {
    if (itemIds.has(item.id.toString())) {
      return 'Already added';
    } else {
      return null;
    }
  };
}

export function createClassTypeExclusion(searchClassType: SearchClassType) {

  const showShapes = containsAny([SearchClassType.Shape, SearchClassType.SpecializedClass], [searchClassType]);
  const showClasses = containsAny([SearchClassType.Class, SearchClassType.SpecializedClass], [searchClassType]);

  return (klass: ClassListItem) => {
    if (!showShapes && klass.isOfType('shape')) {
      return 'Shapes are not allowed';
    } else if (!showClasses && !klass.isOfType('shape')) {
      return 'Classes are not allowed';
    } else if (searchClassType === SearchClassType.SpecializedClass && !klass.isSpecializedClass()) {
      return 'Non specialized classes are not allowed';
    } else {
      return <string> null;
    }
  };
}

export function collectIds(items: WithId[]|WithId[][]): Set<string> {
  return collectProperties<WithId, string>(items, item => {
    return item.id.toString();
  });
}

export function collectProperties<T, TResult>(items: T[]|T[][], propertyExtractor: (item: T) => TResult): Set<TResult> {
  const result = new Set<TResult>();
  for (const item of items) {
    if (Array.isArray(item)) {
      for (const innerItem of item) {
        result.add(propertyExtractor(innerItem));
      }
    } else {
      result.add(propertyExtractor(item));
    }
  }
  return result;
}

export function isModalCancel(err: any) {
  return err === 'cancel' || err === 'escape key press';
}

function normalizeUrl(url: string): string {
  return url.replace(/:/g, '%3A').replace(/&property.*/, '');
}

export function isDifferentUrl(lhs: string, rhs: string): boolean {
  return normalizeUrl(lhs) !== normalizeUrl(rhs);
}

export function normalizeSelectionType(types: Type[]): Type {
  if (containsAny(types, ['class', 'shape'])) {
    return 'class';
  } else if (containsAny(types, ['attribute'])) {
    return 'attribute';
  } else if (containsAny(types, ['association'])) {
    return 'association';
  } else if (containsAny(types, ['model', 'profile', 'library'])) {
    return 'model';
  } else if (containsAny(types, ['property'])) {
    return null;
  } else {
    throw new Error('Unsupported selection type: ' + types.join());
  }
}

export function normalizeReferrerType(types: Type[]): Type {
  return normalizePredicateType(types) || normalizeClassType(types) || normalizeModelType(types) || normalizeGroupType(types);
}

export function normalizePredicateType(types: Type[]): Type {
  return findFirstMatching<Type>(types, ['attribute', 'association', 'property']);
}

export function normalizeClassType(types: Type[]): Type {
  return findFirstMatching<Type>(types, ['shape', 'class']);
}

export function normalizeModelType(types: Type[]): Type {
  const type = findFirstMatching<Type>(types, ['profile', 'library', 'model']);
  if (type === 'model') {
    return 'library';
  } else {
    return type;
  }
}

export function normalizeGroupType(types: Type[]): Type {
  return findFirstMatching<Type>(types, ['group']);
}

function hasValue(obj: any) {
  for (const value of Object.values(obj)) {
    if (!!value) {
      return true;
    }
  }
  return false;
}

export function hasLocalization(localizable: Localizable) {
  return !!localizable && hasValue(localizable);
}
