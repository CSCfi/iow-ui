import ElementFinder = protractor.ElementFinder;
import { EditableComponent } from '../common/component/editableComponent.po';

export class PropertyView {

  label = EditableComponent.byTitleLocalizationKey(this.element, 'Class property label');
  description = EditableComponent.byTitleLocalizationKey(this.element, 'Description');

  constructor(public element: ElementFinder) {
  }
}
