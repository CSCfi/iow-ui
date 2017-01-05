import { INgModelController, IModelFormatter, ILocationService, IPromise, IQService } from 'angular';
import { Validator, AsyncValidator } from '../components/form/validators';
import { normalizeAsArray, all } from './array';
import { valuesExcludingKeys } from './object';
import { Show } from '../components/contracts';

export function hasFixedPositioningParent(e: JQuery) {
  for (let p = e.parent(); p && p.length > 0 && !p.is('body'); p = p.parent()) {
    if (p.css('position') === 'fixed') {
      return true;
    }
  }

  return false;
}

export function isModalCancel(err: any) {
  return err === 'cancel' || err === 'escape key press';
}

export function modalCancelHandler(err: any) {
  // Handle cancellation so that angular doesn't report unhandled promise rejection error
  if (!isModalCancel(err)) {
    throw err;
  }
}

const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

function normalizeUrl(url: string): string {
  return url.replace(/^#/, '').replace(/:/g, '%3A').replace(uuidRegex, '').replace(/\/+$/, '');
}

export function nextUrl($location: ILocationService, next: string) {
  const base = formatApplicationBase($location, '' /* TODO parametrize base href here */);
  return next.substr(base.length + (next.indexOf('#/') !== -1 ? 2 : 0));
}

export function formatApplicationBase($location: ILocationService, baseHref: string) {
  const port = $location.port();
  const portString = (port === 80 || port === 443) ? '' : (':' + $location.port());
  return $location.protocol() + '://' + $location.host() + portString + baseHref;
}

export function isDifferentUrl(lhs: string, rhs: string): boolean {
  return normalizeUrl(lhs) !== normalizeUrl(rhs);
}

export function extendNgModelOptions(ngModel: INgModelController, options: any) {
  if (ngModel.$options) {
    ngModel.$options = ngModel.$options.createChild(options);
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
  const validateAsync = (item: T) => $q.all(asyncValidators.map(asyncValidator => asyncValidator(item)));

  const asyncValidationResults: IPromise<any>[] = [];

  for (const value of values) {
    if (!validateSync(value)) {
      result.set(value, false);
    } else {
      asyncValidationResults.push(validateAsync(value).then(
        () => result.set(value, true),
        _err => result.set(value, false)
      ));
    }
  }

  return $q.all(asyncValidationResults).then(() => new ValidationResult(result));
}

export function setSelectionStyles(element: JQuery, show: Show, selectionWidth: number) {
  element.css({
    'padding-left': '5px',
    width: show === Show.Both ? `${selectionWidth + 5}px` : '100%'
  });

  if (show === Show.Visualization) {
    element.addClass('hide');
  } else {
    element.removeClass('hide');
  }
}

export function ifChanged<T>(cb: (newItem: T, oldItem: T) => void ) {
  return (newItem: T, oldItem: T) => {
    if (newItem !== oldItem) {
      cb(newItem, oldItem);
    }
  };
}

export function isTargetElementInsideElement(event: { target: Element }, element: HTMLElement) {

  const target = event.target;

  for (let e: Element|null = target; !!e; e = e.parentElement) {
    if (e === element) {
      return true;
    }
  }

  return false;
}
