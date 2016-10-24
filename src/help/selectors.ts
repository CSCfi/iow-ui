export const modal = () => angular.element('.modal-dialog');
export const modelView = () => angular.element('model-view');

export function child(parent: () => JQuery, selector: string) {
  return () => parent().find(selector);
}

export const input =                       (parent: () => JQuery) => child(parent, 'input');
export const multiInput =                  (parent: () => JQuery) => child(parent, '.multi-input');
export const editableFocus =               (parent: () => JQuery) => child(parent, '.editable-wrap');
export const editableByTitle =             (parent: () => JQuery, title: string) => child(parent, `editable[data-title="${title}"]`);
export const editableMultipleByTitle =     (parent: () => JQuery, title: string) => child(parent, `editable-multiple[data-title="${title}"]`);
export const searchResult =                (parent: () => JQuery, id: string) => child(parent, `search-results #${CSS.escape(id)}`);
