import ElementFinder = protractor.ElementFinder;

export class EditableTable {

  element: ElementFinder;

  constructor(context: ElementFinder) {
    this.element = context.$('table.editable-table')
  }

  getColumnIndices() {
    return this.element.$$('thead th').map((element, index) => {
      return element.getText().then(text => {
        return { columnName: text, index };
      })
    });
  }

  indexOfColumnName(columnName: string): webdriver.promise.Promise<number> {
    return this.getColumnIndices().then(indicesPromise => {
      return protractor.promise.all(indicesPromise).then(indices => {
        for (const index of indices) {
          if (index.columnName === columnName) {
            return index.index + 1;
          }
        }

        throw new Error('column not found: ' + columnName);
      });
    });
  }

  hasColumnWithText(columnName: string, text: string) {
    return this.indexOfColumnName(columnName).then(index => {
      return this.element.element(by.cssContainingText(`tbody tr td:nth-child(${index})`, text)).isPresent();
    });
  }
}
