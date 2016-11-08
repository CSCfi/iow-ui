import { EditableComponent } from '../common/component/editableComponent.po';
import ElementFinder = protractor.ElementFinder;
import { upperCaseFirst } from 'change-case';
import { ClassType } from '../../../src/entities/type';
import { PropertyView } from './propertyView.po';

export class ClassForm {

  label: EditableComponent;
  description = EditableComponent.byTitleLocalizationKey(this.element, 'Description');

  constructor(public element: ElementFinder, type: ClassType) {
    this.label = EditableComponent.byTitleLocalizationKey(this.element, upperCaseFirst(type) + ' label');
  }

  getProperty(index: number) {
    this.ensurePropertyOpen(index);
    return new PropertyView(this.getPropertyElementAtIndex(index).element(by.css('property-view')));
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
    return this.getPropertyElementAtIndex(index).element(by.css('property-view > div')).isDisplayed();
  }

  isPropertyClosed(index: number) {
    return this.isPropertyOpen(index).then(x => !x);
  }
}
