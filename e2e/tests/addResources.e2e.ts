import { ModelPage } from '../pages/model/modelPage.po';
import { NavBar } from '../pages/common/navbar.po';
import { library1Parameters, library2Parameters } from './test-data';
import { classIdFromNamespaceId, modelIdFromPrefix } from '../util/resource';

const navbar = new NavBar();

describe('Add resources', () => {

  beforeEach(() => {
    navbar.ensureLoggedIn();
  });

  it('adds new class using existing concept', () => {

    const page = ModelPage.navigateToExistingModel(library2Parameters.prefix, library2Parameters.type);

    const searchClass = page.addClass();
    searchClass.search(library2Parameters.classes.first.name);
    const searchConcept = searchClass.selectAddNew();

    searchConcept.selectResultById(library2Parameters.classes.first.conceptId);
    searchConcept.confirm();

    const view = page.classView('class');
    view.saveAndReload();
    expect(view.form.label.content.getText()).toBe(library2Parameters.classes.first.name);
  });

  it('adds new class using concept suggestion', () => {

    const page = ModelPage.navigateToExistingModel(library1Parameters.prefix, library1Parameters.type);

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

    const page = ModelPage.navigateToExistingModel(library1Parameters.prefix, library1Parameters.type);

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

    const page = ModelPage.navigateToExistingModel(library1Parameters.prefix, library1Parameters.type);

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

  it('assigns class from another library', () => {

    const page = ModelPage.navigateToExistingModel(library1Parameters.prefix, library1Parameters.type);

    const searchClass = page.addClass();
    searchClass.search(library2Parameters.classes.first.name);
    searchClass.selectResultById(classIdFromNamespaceId(modelIdFromPrefix(library2Parameters.prefix), library2Parameters.classes.first.name));
    searchClass.confirm();

    const view = page.classView('class');
    view.reload();
    expect(view.form.label.content.getText()).toBe(library2Parameters.classes.first.name);
  });
});
