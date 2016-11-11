import { EditableEntityButtons } from '../common/component/editableEntityButtons.po';
import { NavBar } from '../common/navbar.po';
import { PredicateForm } from './predicateForm.po';
import { KnownPredicateType } from '../../../src/entities/type';
import { defaultTimeout } from '../../util/expectation';
import EC = protractor.ExpectedConditions;

const navbar = new NavBar();

export class PredicateView {

  element = element(by.css('predicate-view'));
  buttons = new EditableEntityButtons(this.element);
  form = new PredicateForm(this.element, this.type);

  constructor(private type: KnownPredicateType) {
    browser.wait(EC.visibilityOf(this.element), defaultTimeout);
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
