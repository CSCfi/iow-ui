import { EditableComponent } from '../common/component/editableComponent.po';
import ElementFinder = protractor.ElementFinder;
import { upperCaseFirst } from 'change-case';
import { ClassType } from '../../../src/entities/type';

export class ClassForm {

  label: EditableComponent;
  description = EditableComponent.byTitleLocalizationKey(this.element, 'Description');

  constructor(public element: ElementFinder, type: ClassType) {
    this.label = EditableComponent.byTitleLocalizationKey(this.element, upperCaseFirst(type) + ' label');
  }
}
