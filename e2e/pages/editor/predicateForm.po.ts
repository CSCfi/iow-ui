import { KnownPredicateType } from '../../../src/entities/type';
import ElementFinder = protractor.ElementFinder;
import { EditableComponent } from '../common/component/editableComponent.po';
import { upperCaseFirst } from 'change-case';

export class PredicateForm {

  label: EditableComponent;
  description = EditableComponent.byTitleLocalizationKey(this.element, 'Description');

  constructor(public element: ElementFinder, type: KnownPredicateType) {
    this.label = EditableComponent.byTitleLocalizationKey(this.element, upperCaseFirst(type) + ' label');
  }
}
