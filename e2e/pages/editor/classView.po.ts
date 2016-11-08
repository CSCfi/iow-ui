import { EditableEntityButtons } from '../common/component/editableEntityButtons.po';
import { NavBar } from '../common/navbar.po';
import { ClassForm } from './classForm.po';
import { ClassType } from '../../../src/entities/type';
import ElementFinder = protractor.ElementFinder;
import { SearchPredicateModal } from './modal/searchPredicateModal.po';

const navbar = new NavBar();

class ClassViewButtons extends EditableEntityButtons {

  addPropertyButton: ElementFinder;

  constructor(context: ElementFinder) {
    super(context);
    this.addPropertyButton = this.element.$('button.add-property');
  }
}

export class ClassView {

  element = element(by.css('class-view'));
  buttons = new ClassViewButtons(this.element);
  form = new ClassForm(this.element, this.type);

  constructor(private type: ClassType) {
  }

  addProperty() {
    this.buttons.addPropertyButton.click();
    return new SearchPredicateModal();
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
