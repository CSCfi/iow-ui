import { EditableComponent } from './editableComponent.po';
import { ElementFinder } from 'protractor';
import Key = protractor.Key;

export class MultipleEditableComponent extends EditableComponent {

  constructor(element: ElementFinder) {
    super(element);
  }

  static byElementNameAndTitleLocalizationKey(elementName: string, title: string) {
    return new MultipleEditableComponent(element(by.css(`${elementName}[data-title="${title}"]`)));
  }

  clearExistingValues() {
    this.editableElement.all(by.css('.delete-item')).each(item => item.click());
  }

  setItems(values: string[]) {
    this.clearExistingValues();
    this.addItems(values);
    this.setValue(Key.ESCAPE); // dismiss autocomplete
  }

  addItem(value: string) {
    this.setValue(value + Key.ESCAPE + Key.ENTER); // dismiss autocomplete and add
  }

  addItems(values: string[]) {
    for (const value of values) {
      this.addItem(value);
    }
  }
}
