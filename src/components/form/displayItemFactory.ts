import ILocationService = angular.ILocationService;
import IScope = angular.IScope;
import gettextCatalog = angular.gettext.gettextCatalog;
import { LanguageService } from '../../services/languageService';
import { Localizable, isLocalizable, LanguageContext } from '../../services/entities';
import { Uri } from '../../services/uri';
import { isString, isNumber } from '../../utils/object';
import { isDifferentUrl } from '../../utils/angular';

export type Value = string|Localizable|number|Uri;

export class DisplayItem {
  constructor(private $location: ILocationService,
              private languageService: LanguageService,
              private gettextCatalog: gettextCatalog,
              private context: () => LanguageContext,
              public value: () => Value,
              private link: (value: Value) => string,
              private hideLinks: () => boolean,
              private valueAsLocalizationKey: boolean) {
  }

  get displayValue(): string {
    const value = this.value();

    if (value instanceof Uri) {
      return value.compact;
    }  else if (isLocalizable(value)) {
      return this.languageService.translate(value, this.context());
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
    } else {
      return '';
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
    return this.link(this.value());
  }
}

export class DisplayItemFactory {
  /* @ngInject */
  constructor(private $location: ILocationService, private languageService: LanguageService, private gettextCatalog: gettextCatalog) {
  }

  create(context: () => LanguageContext, value: () => Value, link: (value: Value) => string, valueAsLocalizationKey: boolean, hideLinks: () => boolean = () => false) {
    return new DisplayItem(this.$location, this.languageService, this.gettextCatalog, context, value, link, hideLinks, valueAsLocalizationKey);
  }
}
