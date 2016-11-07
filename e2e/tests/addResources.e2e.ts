import { ModelPage } from '../pages/model/modelPage.po';
import { NavBar } from '../pages/common/navbar.po';
import { library1Parameters } from './test-data';

const navbar = new NavBar();

describe('Add resources', () => {

  let page: ModelPage;

  beforeEach(() => {
    page = ModelPage.navigateToExistingModel(library1Parameters.prefix, library1Parameters.type);
    navbar.ensureLoggedIn();
  });

  it('adds new class using concept suggestion', () => {

    const searchClass = page.addClass();
    searchClass.search(library1Parameters.classes.first.name);
    const searchConcept = searchClass.selectAddNew();

    searchConcept.suggestNewConcept();
    searchConcept.definition.appendValue('Definition');
    searchConcept.confirm();

    const view = page.classView('class');
    view.saveAndReload();
    expect(view.form.label.content.getText()).toBe(library1Parameters.classes.first.name);
  });

  it('adds new attribute using concept suggestion', () => {

    const searchAttribute = page.addAttribute();
    searchAttribute.search(library1Parameters.attributes.first.name);
    const searchConcept = searchAttribute.selectAddNew();

    searchConcept.suggestNewConcept();
    searchConcept.definition.appendValue('Definition');
    searchConcept.confirm();

    const view = page.predicateView('attribute');
    view.saveAndReload();
    expect(view.form.label.content.getText()).toBe(library1Parameters.attributes.first.name);
  });

  it('adds new association using concept suggestion', () => {

    const searchAssociation = page.addAssociation();
    searchAssociation.search(library1Parameters.associations.first.name);
    const searchConcept = searchAssociation.selectAddNew();

    searchConcept.suggestNewConcept();
    searchConcept.definition.appendValue('Definition');
    searchConcept.confirm();

    const view = page.predicateView('association');
    view.saveAndReload();
    expect(view.form.label.content.getText()).toBe(library1Parameters.associations.first.name);
  });
});
