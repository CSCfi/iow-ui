import { EditableEntityButtons } from '../common/component/editableEntityButtons.po';
import { NavBar } from '../common/navbar.po';
import { ClassForm } from './classForm.po';
import { ClassType } from '../../../src/entities/type';

const navbar = new NavBar();

export class ClassView {

  element = element(by.css('class-view'));
  buttons = new EditableEntityButtons(this.element);
  form = new ClassForm(this.element, this.type);

  constructor(private type: ClassType) {
  }

  edit() {
    this.buttons.edit();
  }

  reload() {
    browser.refresh();
    navbar.ensureLoggedIn();
  }

  saveAndReload() {
    this.buttons.save();
    this.reload();
  }
}
