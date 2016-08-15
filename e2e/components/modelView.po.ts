import { EditableComponent } from './editableComponent.po';
import { Type } from '../../src/services/entities';
import { upperCaseFirst } from 'change-case';
import { EditableEntityButtons } from './editableEntityButtons.po';

export class ModelView {

  element = element(by.css('model-view'));
  title = this.element.$('.main-header,.model-header h2');
  content = this.element.$('.main-editable-content');
  buttons = new EditableEntityButtons(this.element);

  label: EditableComponent;
  // TODO rest of editables

  constructor(private type: Type) {
    this.label = EditableComponent.byTitleLocalizationKey(upperCaseFirst(type) + ' label');
  }

  toggle() {
    this.title.click();
  }

  ensureOpen() {
    if (this.isClosed()) {
      this.toggle();
    }
  }

  ensureClosed() {
    if (this.isOpen()) {
      this.toggle();
    }
  }

  isOpen() {
    return this.content.isDisplayed();
  }

  isClosed() {
    return this.isOpen().then(x => !x);
  }
}
