import ILocationService = angular.ILocationService;
import IScope = angular.IScope;
import gettextCatalog = angular.gettext.gettextCatalog;
import * as _ from 'lodash';
import { EditableForm } from './editableEntityController';
import { LanguageService } from '../../services/languageService';
import { Localizable, isLocalizable } from '../../services/entities';
import { isString, isNumber, isDifferentUrl, normalizeAsArray } from '../../services/utils';

export type Value = string|Localizable;

export class DisplayItem {
  constructor(private $location: ILocationService,
              private languageService: LanguageService,
              private gettextCatalog: gettextCatalog,
              public value: () => Value,
              private link: (value: string) => string,
              private hideLinks: () => boolean,
              private valueAsLocalizationKey: boolean) {
  }

  get displayValue(): string {
    const value = this.value();

    if (isLocalizable(value)) {
      return this.languageService.translate(value);
    } else if (isString(value)) {
      if (this.valueAsLocalizationKey) {
        return this.gettextCatalog.getString(value);
      } else {
        return value;
      }
    } else if (isNumber(value)) {
      return value.toString();
    } else if (!value) {
      return '';
    } else {
      throw new Error('Cannot convert to display value: ' + value);
    }
  }

  get href(): string {
    const link = this.formatLink();
    if (link) {
      const external = !link.startsWith('/');
      return external ? link : '#' + link;
    }
  }

  get showLink(): boolean {
    const link = this.formatLink();
    return !this.hideLinks() && link && isDifferentUrl(link, this.$location.url());
  }

  get showPlain(): boolean {
    return !this.showLink;
  }

  private formatLink() {
    return this.link(this.displayValue);
  }
}

export class DisplayItemFactory {
  /* @ngInject */
  constructor(private $location: ILocationService, private languageService: LanguageService, private gettextCatalog: gettextCatalog) {
  }

  create(value: () => Value, link: (value: string) => string, valueAsLocalizationKey: boolean, hideLinks: () => boolean = () => false) {
    return new DisplayItem(this.$location, this.languageService, this.gettextCatalog, value, link, hideLinks, valueAsLocalizationKey);
  }
}
