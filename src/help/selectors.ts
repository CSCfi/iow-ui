export const modal = () => angular.element('.modal-dialog');
export const modalBody = child(modal, '.modal-body');
export const modelView = () => angular.element('model-view');
export const classView = () => angular.element('class-view');

export function child(parent: () => JQuery, selector: string) {
  return () => parent().find(selector);
}

export function nth(element: () => JQuery, index: number) {
  return () => element().eq(index);
}

export function first(element: () => JQuery) {
  return nth(element, 0);
}

export function second(element: () => JQuery) {
  return nth(element, 1);
}

export const input =                       (parent: () => JQuery) => child(parent, 'input,select,textarea');
export const multiInput =                  (parent: () => JQuery) => child(parent, '.multi-input');
export const editableFocus =               (parent: () => JQuery) => child(parent, '.editable-wrap');
export const editableByTitle =             (parent: () => JQuery, title: string) => child(parent, `editable[data-title="${title}"]`);
export const editableMultipleByTitle =     (parent: () => JQuery, title: string) => child(parent, `editable-multiple[data-title="${title}"]`);
export const searchResult =                (parent: () => JQuery, id: string) => child(parent, `search-results #${CSS.escape(id)}`);
