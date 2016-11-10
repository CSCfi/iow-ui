import ElementFinder = protractor.ElementFinder;
import { EditableComponent } from '../common/component/editableComponent.po';
import { PropertyPredicateView } from './propertyPredicateView.po';
import { KnownPredicateType } from '../../../src/entities/type';

export class PropertyView {

  label = EditableComponent.byTitleLocalizationKey(this.element, 'Class property label');
  description = EditableComponent.byTitleLocalizationKey(this.element, 'Description');
  removeButton  = this.element.$('button.remove');
  reusablePredicate = this.element.$('uib-accordion.reusable-predicate');

  constructor(public element: ElementFinder, public type: KnownPredicateType) {
  }

  remove() {
    this.removeButton.click();
  }

  openPropertyReusablePredicate() {
    this.ensureReusablePredicateOpen();
    return new PropertyPredicateView(this.reusablePredicate, this.type);
  }

  toggleReusablePredicate() {
    this.reusablePredicate.$('.panel-heading').click();
  }

  ensureReusablePredicateOpen() {
    return this.isReusablePredicateClosed().then(closed => {
      if (closed) {
        return this.toggleReusablePredicate();
      }
    });
  }

  isReusablePredicateOpen() {
    return this.reusablePredicate.$('property-predicate-view').isPresent();
  }

  isReusablePredicateClosed() {
    return this.isReusablePredicateOpen().then(x => !x);
  }
}
