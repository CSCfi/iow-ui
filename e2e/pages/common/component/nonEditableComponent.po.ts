import { ElementFinder } from 'protractor';

export class NonEditableComponent {

  content: ElementFinder;

  constructor(public nonEditableElement: ElementFinder) {
    this.content = nonEditableElement.$('.content');
  }

  static byTitleLocalizationKey(context: ElementFinder, title: string) {
    return new NonEditableComponent(context.$(`non-editable[data-title="${title}"]`));
  }
}
