import ElementFinder = protractor.ElementFinder;

type ColumnIndices = { [columnName: string]: number };

export class EditableTable {

  element: ElementFinder;

  constructor(context: ElementFinder) {
    this.element = context.$('table.editable-table');
  }

  getRowByColumnText(columnName: string, text: string): EditableTableRow {

    const indicesPromise = this.element.$$('thead th').map((element, index) => element.getText().then(text => [text, index + 1]))
      .then(tuplePromises => protractor.promise.all(tuplePromises))
      .then((tuples: [string, number][]) => {
        const indices: ColumnIndices = {};
        for (const [text, index] of tuples) {
          indices[text] = index;
        }
        return indices;
      });

    const rowElement = indicesPromise.then(indices => {
      const cell = this.element.element(by.cssContainingText(`tbody tr td:nth-child(${indices[columnName]})`, text));
      return cell.element(by.xpath('..'));
    });

    return new EditableTableRow(rowElement, indicesPromise);
  }

  isEmpty() {
    return this.element.isPresent().then(x => !x);
  }
}

export class EditableTableRow {

  constructor(private rowElementPromise: protractor.promise.Promise<ElementFinder>, private indicesPromise: protractor.promise.Promise<ColumnIndices>) {
  }

  getCellText(columnName: string) {
    return protractor.promise.all([this.rowElementPromise, this.indicesPromise]).then(([element, indices]) => {
      return element.$(`td:nth-child(${indices[columnName]})`).getText();
    });
  }

  edit() {
    return this.rowElementPromise.then(element => element.$('td.action.edit').click());
  }

  remove() {
    return this.rowElementPromise.then(element => element.$('td.action.remove').click());
  }

  isPresent() {
    return this.rowElementPromise.then(e => e.isPresent());
  }
}
