import { EditableEntityButtons } from '../common/component/editableEntityButtons.po';
import { NavBar } from '../common/navbar.po';
import { PredicateForm } from './predicateForm.po';
import { KnownPredicateType } from '../../../src/entities/type';

const navbar = new NavBar();

export class PredicateView {

  element = element(by.css('predicate-view'));
  buttons = new EditableEntityButtons(this.element);
  form = new PredicateForm(this.element, this.type);

  constructor(private type: KnownPredicateType) {
  }

  edit() {
    this.buttons.edit();
  }

  saveAndReload() {
    this.buttons.save();
    browser.refresh();
    navbar.ensureLoggedIn();
  }
}
