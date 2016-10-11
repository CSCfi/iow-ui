import { EditableComponent } from '../common/component/editableComponent.po';
import { upperCaseFirst } from 'change-case';
import { EditableEntityButtons } from '../common/component/editableEntityButtons.po';
import { EditableMultipleComponent } from '../common/component/editableMultipleComponent.po';
import { VocabulariesView } from './vocabulariesView.po';
import { LinksView } from './linksView.po';
import { NamespacesView } from './namespacesView.po';
import { ReferenceDataView } from './referenceDataView.po';
import { NavBar } from '../common/navbar.po';
import { KnownModelType } from '../../../src/entities/type';

const navbar = new NavBar();

export class ModelView {

  element = element(by.css('model-view'));
  title = this.element.$('.main-header,.model-header h2');
  content = this.element.$('.main-editable-content');
  buttons = new EditableEntityButtons(this.element);

  label: EditableComponent;
  description = EditableComponent.byTitleLocalizationKey(this.element, 'Description');
  language = EditableMultipleComponent.byElementNameAndTitleLocalizationKey(this.element, 'editable-multiple-language-select', 'Model languages');

  vocabularies = new VocabulariesView();
  referenceData = new ReferenceDataView();
  namespaces = new NamespacesView();
  links = new LinksView();

  constructor(type: KnownModelType) {
    this.label = EditableComponent.byTitleLocalizationKey(this.element, upperCaseFirst(type) + ' label');
  }

  edit() {
    this.buttons.edit();
  }

  saveAndReload() {
    this.buttons.save();
    browser.refresh();
    navbar.ensureLoggedIn();
    this.ensureOpen();
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
