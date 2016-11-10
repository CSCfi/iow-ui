import { EditableEntityButtons } from '../common/component/editableEntityButtons.po';
import { NavBar } from '../common/navbar.po';
import { ClassForm } from './classForm.po';
import { ClassType, KnownPredicateType } from '../../../src/entities/type';
import ElementFinder = protractor.ElementFinder;
import { SearchPredicateModal } from './modal/searchPredicateModal.po';
import { AddResourceParameters } from '../model/modelPage.po';
import { assertNever } from '../../../src/utils/object';

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

  addProperty(property: { origin: AddResourceParameters, predicateType: KnownPredicateType }) {

    this.buttons.addPropertyButton.click();
    const searchPredicate = new SearchPredicateModal();

    searchPredicate.search(property.origin.name);

    switch (property.origin.type) {
      case 'conceptSuggestion':
        const suggestionModal = searchPredicate.selectAddNew(property.predicateType);
        suggestionModal.suggestNewConcept();
        suggestionModal.definition.appendValue('Definition');
        suggestionModal.confirm();
        searchPredicate.confirm();
        break;
      case 'existingConcept':
        const conceptModal = searchPredicate.selectAddNew(property.predicateType);
        conceptModal.selectResultById(property.origin.conceptId);
        conceptModal.confirm();
        searchPredicate.confirm();
        break;
      case 'existingResource':
        searchPredicate.selectResultById(property.origin.id);
        searchPredicate.confirm();
        break;
      case 'externalResource':
        searchPredicate.selectAddNewExternal();
        searchPredicate.externalIdElement.setValue(property.origin.id);
        searchPredicate.confirm();
        break;
      default:
        assertNever(property.origin);
    }

    browser.sleep(800); // wait for scroll
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
