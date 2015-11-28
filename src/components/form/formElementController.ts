import gettextCatalog = angular.gettext.gettextCatalog;
import ILocationService = angular.ILocationService;
import { EditableForm } from './editableEntityController';
import { LanguageService } from '../../services/languageService';
import { Localizable, isLocalizable } from '../../services/entities';
import { isString } from '../../services/utils';

export abstract class FormElementController {

  title: string;
  link: string;
  valueAsLocalizationKey: boolean;
  formController: EditableForm;

  /* @ngInject */
  constructor(private $location: ILocationService, private languageService: LanguageService, private gettextCatalog: gettextCatalog) {
  }

  abstract getValue(): string|Localizable;
  abstract showNonEditable(): boolean;

  private isDifferentUrl(url: string): boolean {
    function normalize(url: string): string {
      return url.replace(/:/g, '%3A').replace(/&property.*/, '');
    }
    return normalize(this.$location.url()) !== normalize(url);
  }

  get external(): boolean {
    return this.link && !this.link.startsWith('/');
  }

  get href(): string {
    return this.external ? this.link : '#' + this.link;
  }

  get showLink(): boolean {
    return this.showNonEditable() && this.link && this.isDifferentUrl(this.link)
  }

  get showPlain(): boolean {
    return this.showNonEditable() && !this.showLink;
  }

  get displayValue(): string {
    const value: Localizable|string = this.getValue();
    if (isLocalizable(value)) {
      return this.languageService.translate(value);
    } else if (isString(value)) {
      return value && this.valueAsLocalizationKey ? this.gettextCatalog.getString(value) : value;
    }
  }
}
