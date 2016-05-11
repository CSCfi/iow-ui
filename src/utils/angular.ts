import INgModelController = angular.INgModelController;
import IModelFormatter = angular.IModelFormatter;
import { normalizeAsArray } from './array';

export function isModalCancel(err: any) {
  return err === 'cancel' || err === 'escape key press';
}

function normalizeUrl(url: string): string {
  return url.replace(/^#/, '').replace(/:/g, '%3A').replace(/&property.*/, '');
}

export function isDifferentUrl(lhs: string, rhs: string): boolean {
  return normalizeUrl(lhs) !== normalizeUrl(rhs);
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
