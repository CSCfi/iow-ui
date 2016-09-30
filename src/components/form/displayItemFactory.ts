import { ILocationService } from 'angular';
import gettextCatalog = angular.gettext.gettextCatalog;
import { LanguageService } from '../../services/languageService';
import { Localizable, isLocalizable, LanguageContext } from '../../services/entities';
import { Uri } from '../../services/uri';
import { isString, isNumber } from '../../utils/object';
import { isDifferentUrl } from '../../utils/angular';
import { Moment } from 'moment';
import * as moment from 'moment';

export type Value = string|Localizable|number|Uri|Moment;

function isMoment(obj: any): obj is Moment {
  return moment.isMoment(obj);
}

export class DisplayItem {

  onClick: (value: Value) => void;

  constructor(private $location: ILocationService,
              private languageService: LanguageService,
              private gettextCatalog: gettextCatalog,
              private config: DisplayItemConfiguration) {

    this.onClick = config.onClick;
  }

  get displayValue(): string {
    const value = this.value;

    if (isMoment(value)) {
      return value.format(this.gettextCatalog.getString('date format'));
    } else if (value instanceof Uri) {
      return value.compact;
    }  else if (isLocalizable(value)) {
      return this.languageService.translate(value, this.config.context());
    } else if (isString(value)) {
      if (this.config.valueAsLocalizationKey) {
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

  get value() {
    return this.config.value();
  }

  get href() {
    if (this.config.hideLinks && this.config.hideLinks()) {
      return null;
    } else {
      const link = this.config.link && this.config.link();

      if (!link || !isDifferentUrl(link, this.$location.url())) {
        return null;
      } else {
        return link;
      }
    }
  }
}

export type DisplayItemConfiguration = {
  context(): LanguageContext;
  value(): Value;
  link?(): string;
  onClick?(value: Value): void;
  hideLinks?: () => boolean;
  valueAsLocalizationKey?: boolean;
}


export class DisplayItemFactory {
  /* @ngInject */
  constructor(private $location: ILocationService, private languageService: LanguageService, private gettextCatalog: gettextCatalog) {
  }

  create(config: DisplayItemConfiguration) {
    return new DisplayItem(this.$location, this.languageService, this.gettextCatalog, config);
  }
}
