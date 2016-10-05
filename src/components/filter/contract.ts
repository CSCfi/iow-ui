import { Localizable } from '../../services/entities';
import { AddNew } from '../common/searchResults';
import { all, limit } from '../../utils/array';

export const defaultSearchLimit = 100;

export function applyFilters<T>(searchResults: T[], filters: SearchFilter<T>[], limitResults = defaultSearchLimit) {
  return limit(searchResults.filter(klass => all(filters, filter => filter(klass))), limitResults);
}

export interface SearchController<T> {
  addFilter(filter: SearchFilter<T>): void;
  search(): void;
  items: T[];
  searchResults: (AddNew|T)[];
}

export interface SearchFilter<T> {
  (item: T): boolean;
}

export interface ContentExtractor<T> {
  (item: T): Localizable|string;
}
