import { ElementFinder } from 'protractor';

export class NonEditableComponent {

  content: ElementFinder;

  constructor(public editableElement: ElementFinder) {
    this.content = editableElement.$('.content');
  }

  static byTitleLocalizationKey(title: string) {
    return new NonEditableComponent(element(by.css(`non-editable[data-title="${title}"]`)));
  }
}
