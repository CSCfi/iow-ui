import { EditableComponent } from '../common/component/editableComponent.po';
import { Type } from '../../../src/services/entities';
import { upperCaseFirst } from 'change-case';
import { EditableEntityButtons } from '../common/component/editableEntityButtons.po';
import { EditableMultipleComponent } from '../common/component/editableMultipleComponent.po';
import { VocabulariesView } from './vocabulariesView.po';
import { LinksView } from './linksView.po';
import { NamespacesView } from './namespacesView.po';
import { ReferenceDataView } from './referenceDataView.po';

export class ModelView {

  element = element(by.css('model-view'));
  title = this.element.$('.main-header,.model-header h2');
  content = this.element.$('.main-editable-content');
  buttons = new EditableEntityButtons(this.element);

  label: EditableComponent;
  description = EditableComponent.byTitleLocalizationKey('Description');
  language = EditableMultipleComponent.byElementNameAndTitleLocalizationKey('editable-multiple-language-select', 'Model languages');

  vocabularies = new VocabulariesView();
  referenceData = new ReferenceDataView();
  namespaces = new NamespacesView();
  links = new LinksView();

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
