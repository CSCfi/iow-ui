import INgModelController = angular.INgModelController;
import IModelFormatter = angular.IModelFormatter;
import ILocationService = angular.ILocationService;
import IPromise = angular.IPromise;
import IQService = angular.IQService;
import { Validator, AsyncValidator } from '../components/form/validators';
import { normalizeAsArray, all } from './array';
import { valuesExcludingKeys } from './object';

export function isModalCancel(err: any) {
  return err === 'cancel' || err === 'escape key press';
}

const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeUrl(url: string, removeProperty: boolean = false): string {
  return url.replace(/^#/, '').replace(/:/g, '%3A').replace(uuidRegex, '');
}

export function formatApplicationBase($location: ILocationService, baseHref: string) {
  const port = $location.port();
  const portString = (port === 80 || port === 443) ? '' : (':' + $location.port());
  return $location.protocol() + '://' + $location.host() + portString + baseHref;
}

export function isDifferentUrl(lhs: string, rhs: string, ignoreProperty: boolean = false): boolean {
  return normalizeUrl(lhs, ignoreProperty) !== normalizeUrl(rhs, ignoreProperty);
}

export function extendNgModelOptions(ngModel: INgModelController, options: any) {
  if (ngModel.$options) {
    Object.assign(ngModel.$options, options);
  } else {
    ngModel.$options = options;
  }
}

export function scrollToElement(element: JQuery, parentContainer: JQuery) {

  const itemsHeight = parentContainer.height();
  const itemsTop = parentContainer.scrollTop();
  const itemsBottom = itemsHeight + itemsTop;
  const selectionOffsetTop = element.offset().top - parentContainer.offset().top + itemsTop;
  const selectionOffsetBottom = selectionOffsetTop +  element.outerHeight();

  if (selectionOffsetBottom > itemsBottom) {
    parentContainer.animate({ scrollTop: Math.ceil(selectionOffsetBottom - itemsHeight) }, 0);
  } else if (selectionOffsetTop < itemsTop) {
    parentContainer.animate({ scrollTop: Math.floor(selectionOffsetTop) }, 0);
  }
}

export function formatWithFormatters(value: any, formatters: IModelFormatter|IModelFormatter[]): any {
  let result = value;

  for (const formatter of normalizeAsArray(formatters)) {
    result = formatter(result);
  }
  return result;
}

export class ValidationResult<T> {

  constructor(private result: Map<T, boolean>) {
  }

  isValid(value: T) {
    return this.result.get(value);
  }
}

export function validateWithValidators<T>($q: IQService, ngModelController: INgModelController, skipValidators: Set<string>, values: T[]) {
  const result = new Map<T, boolean>();

  const validators = valuesExcludingKeys<Validator<T>>(ngModelController.$validators, skipValidators);
  const asyncValidators = valuesExcludingKeys<AsyncValidator<T>>(ngModelController.$asyncValidators, skipValidators);

  const validateSync = (item: T) => all(validators, validator => validator(item));
  const validateAsync = (item: T) => $q.all(_.map(asyncValidators, asyncValidator => asyncValidator(item)));

  const asyncValidationResults: IPromise<any>[] = [];

  for (const value of values) {
    if (!validateSync(value)) {
      result.set(value, false);
    } else {
      asyncValidationResults.push(validateAsync(value).then(
        () => result.set(value, true),
        err => result.set(value, false)
      ));
    }
  }

  return $q.all(asyncValidationResults).then(() => new ValidationResult(result));
}
