import { Localizable } from '../../services/entities';
import { AddNew } from '../common/searchResults';

export interface SearchController<T> {
  addFilter(filter: SearchFilter<T>): void;
  search(): void;
  items: T[];
  searchResults: (AddNew|T)[];
}

export interface SearchFilter<T> {
  (item: T): boolean
}

export interface ContentExtractor<T> {
  (item: T): Localizable|string;
}
