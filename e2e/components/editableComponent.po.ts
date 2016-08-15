import { ElementFinder } from 'protractor';

export class EditableComponent {

  inputElement: ElementFinder;
  content: ElementFinder;

  constructor(public element: ElementFinder) {
    this.inputElement = element.$('[ng-model]');
    this.content = element.$(' .content *');
  }

  static byTitleLocalizationKey(title: string) {
    return new EditableComponent(element(by.css(`editable[data-title="${title}"]`)));
  }

  isEditing() {
    return this.inputElement.isDisplayed();
  }

  setValue(value: string) {
    this.inputElement.sendKeys(value);
  }
}
