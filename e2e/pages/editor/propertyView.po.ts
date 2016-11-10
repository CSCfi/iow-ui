import ElementFinder = protractor.ElementFinder;
import { EditableComponent } from '../common/component/editableComponent.po';

export class PropertyView {

  label = EditableComponent.byTitleLocalizationKey(this.element, 'Class property label');
  description = EditableComponent.byTitleLocalizationKey(this.element, 'Description');
  removeButton  = this.element.$('button.remove');

  constructor(public element: ElementFinder) {
  }

  remove() {
    this.removeButton.click();
  }
}
