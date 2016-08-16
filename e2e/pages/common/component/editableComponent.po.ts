import { ElementFinder } from 'protractor';

export class EditableComponent {

  inputElement: ElementFinder;
  content: ElementFinder;

  constructor(public editableElement: ElementFinder) {
    this.inputElement = editableElement.$('input[ng-model],select[ng-model],textarea[ng-model]');
    this.content = editableElement.$('.content');
  }

  static byTitleLocalizationKey(title: string) {
    return new EditableComponent(element(by.css(`editable[data-title="${title}"]`)));
  }

  isEditing() {
    return this.inputElement.isDisplayed();
  }

  appendValue(value: string) {
    this.inputElement.sendKeys(value);
  }

  setValue(value: string) {
    this.inputElement.clear().then(() => {
      this.appendValue(value);
    });
  }
}
