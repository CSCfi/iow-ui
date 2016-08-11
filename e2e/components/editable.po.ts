import { ElementFinder } from 'protractor';

export class EditableComponent {

  element: ElementFinder;

  constructor(private title: string) {
    this.element = element(by.css(`editable[data-title="${this.title}"]`));
  }

  get text() {
    return this.element.$(' .content *').getText();
  }
}
