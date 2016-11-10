import ElementFinder = protractor.ElementFinder;
import { NonEditableComponent } from '../common/component/nonEditableComponent.po';
import { KnownPredicateType } from '../../../src/entities/type';
import { upperCaseFirst } from 'change-case';

export class PropertyPredicateView {

  label: NonEditableComponent;
  description = NonEditableComponent.byTitleLocalizationKey(this.element, 'Description');

  constructor(public element: ElementFinder, public type: KnownPredicateType) {
    this.label = NonEditableComponent.byTitleLocalizationKey(this.element, upperCaseFirst(type) + ' label');
  }
}
