import { EditableComponent } from '../common/component/editableComponent.po';
import ElementFinder = protractor.ElementFinder;
import { upperCaseFirst } from 'change-case';
import { ClassType, KnownPredicateType } from '../../../src/entities/type';
import { PropertyView } from './propertyView.po';
import EC = protractor.ExpectedConditions;
import { defaultTimeout } from '../../util/expectation';

export class ClassForm {

  id = EditableComponent.byTitleLocalizationKey(this.element, upperCaseFirst(this.type) + ' id');
  label = EditableComponent.byTitleLocalizationKey(this.element, upperCaseFirst(this.type) + ' label');
  description = EditableComponent.byTitleLocalizationKey(this.element, 'Description');
  properties = this.element.$$('accordion.properties accordion-group');

  constructor(public element: ElementFinder, public type: ClassType) {
  }

  openProperty(index: number, type: KnownPredicateType) {
    this.ensurePropertyOpen(index);
    const openedPropertyView = this.getPropertyElementAtIndex(index).element(by.css('property-view'));
    browser.wait(EC.presenceOf(openedPropertyView), defaultTimeout);
    return new PropertyView(openedPropertyView, type);
  }

  private getPropertyElementAtIndex(index: number) {
    return this.element.element(by.repeater('property in ctrl.properties track by property.internalId').row(index));
  }

  toggleProperty(index: number) {
    this.getPropertyElementAtIndex(index).element((by.css('.panel-heading'))).click();
  }

  ensurePropertyOpen(index: number) {
    return this.isPropertyClosed(index).then(closed => {
      if (closed) {
        return this.toggleProperty(index);
      }
    });
  }

  isPropertyOpen(index: number) {
    return this.getPropertyElementAtIndex(index).element(by.css('property-view > div')).isPresent();
  }

  isPropertyClosed(index: number) {
    return this.isPropertyOpen(index).then(x => !x);
  }
}
