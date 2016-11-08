import { EditableEntityButtons } from '../common/component/editableEntityButtons.po';
import { NavBar } from '../common/navbar.po';
import { KnownModelType } from '../../../src/entities/type';
import { ModelForm } from './modelForm.po';

const navbar = new NavBar();

export class ModelView {

  element = element(by.css('model-view'));
  title = this.element.$('.main-header,.model-header h2');
  content = this.element.$('.main-editable-content');
  buttons = new EditableEntityButtons(this.element);
  form = new ModelForm(this.element, this.type);

  constructor(private type: KnownModelType) {
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
    this.isClosed().then(closed => {
      if (closed) {
        this.toggle();
      }
    });
  }

  isOpen() {
    return this.content.isDisplayed();
  }

  isClosed() {
    return this.isOpen().then(x => !x);
  }
}
