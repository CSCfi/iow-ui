import ElementFinder = protractor.ElementFinder;

export class EditableTable {

  element: ElementFinder;

  constructor(context: ElementFinder) {
    this.element = context.$('table.editable-table')
  }

  hasColumnWithText(value: string) {
    return this.element.element(by.cssContainingText('td', value)).isPresent();
  }
}
