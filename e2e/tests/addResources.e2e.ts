import { ModelPage } from '../pages/model/modelPage.po';
import { NavBar } from '../pages/common/navbar.po';
import { library1Parameters, library2Parameters, profileParameters } from './test-data';
import { ClassView } from '../pages/editor/classView.po';
import { classNameToResourceId } from '../util/resource';
import { AddPropertiesFromClassModal } from '../pages/editor/modal/addPropertiesFromClassModal.po';

const navbar = new NavBar();
// FIXME: extract common logic to page objects
describe('Add resources', () => {

  beforeEach(() => {
    navbar.ensureLoggedIn();
  });

  it('adds new classes using existing concepts', () => {

    const page = ModelPage.navigateToExistingModel(library2Parameters.prefix, library2Parameters.type);

    function addClassUsingExistingConcept(name: string, conceptId: string ){

      const searchClass = page.addClass();
      searchClass.search(name);
      const searchConcept = searchClass.selectAddNew();

      searchConcept.selectResultById(conceptId);
      searchConcept.confirm();

      const view = page.classView('class');
      view.saveAndReload();
      expect(view.form.label.content.getText()).toBe(name);
    }

    addClassUsingExistingConcept(library2Parameters.classes.first.name, library2Parameters.classes.first.conceptId);
    addClassUsingExistingConcept(library2Parameters.classes.second.name, library2Parameters.classes.second.conceptId);
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

    const page = ModelPage.navigateToExistingModel(library2Parameters.prefix, library2Parameters.type);

    const searchAttribute = page.addAttribute();
    searchAttribute.search(library2Parameters.attributes.first.name);
    const searchConcept = searchAttribute.selectAddNew();

    searchConcept.suggestNewConcept();
    searchConcept.definition.appendValue('Definition');
    searchConcept.confirm();

    const view = page.predicateView('attribute');
    view.saveAndReload();
    expect(view.form.label.content.getText()).toBe(library2Parameters.attributes.first.name);
  });

  it('adds new association using concept suggestion', () => {

    const page = ModelPage.navigateToExistingModel(library2Parameters.prefix, library2Parameters.type);

    const searchAssociation = page.addAssociation();
    searchAssociation.search(library2Parameters.associations.first.name);
    const searchConcept = searchAssociation.selectAddNew();

    searchConcept.suggestNewConcept();
    searchConcept.definition.appendValue('Definition');
    searchConcept.confirm();

    const view = page.predicateView('association');
    view.saveAndReload();
    expect(view.form.label.content.getText()).toBe(library2Parameters.associations.first.name);
  });

  it('assigns class from another library', () => {

    const page = ModelPage.navigateToExistingModel(library1Parameters.prefix, library1Parameters.type);

    const searchClass = page.addClass();
    searchClass.search(library1Parameters.classes.second.name);
    searchClass.selectResultById(library1Parameters.classes.second.id);
    searchClass.confirm();

    const view = page.classView('class');
    view.reload();
    expect(view.form.label.content.getText()).toBe(library1Parameters.classes.second.name);
  });

  it('specializes class without properties from library', () => {

    const page = ModelPage.navigateToExistingModel(profileParameters.prefix, profileParameters.type);

    const searchClass = page.addClass();
    searchClass.search(profileParameters.classes.first.name);
    searchClass.selectResultById(profileParameters.classes.first.id);
    searchClass.confirm();

    const view = page.classView('shape');
    view.saveAndReload();
    expect(view.form.label.content.getText()).toBe(profileParameters.classes.first.name);
  });

  describe('Adds properties to profile class', () => {

    let page: ModelPage;
    let view: ClassView;

    beforeEach(() => {
      page = ModelPage.navigateToResource(profileParameters.prefix, profileParameters.type, classNameToResourceId(profileParameters.classes.first.name));
      view = page.classView('shape');
    });

    it('adds external attribute', () => {

      view.edit();
      const searchPredicate = view.addProperty();

      searchPredicate.search(profileParameters.classes.first.properties.first.name);
      searchPredicate.selectAddNewExternal();
      searchPredicate.externalIdElement.setValue(profileParameters.classes.first.properties.first.id);
      searchPredicate.confirm();

      browser.sleep(800); // wait for scroll
      view.form.getProperty(0).label.setValue(profileParameters.classes.first.properties.first.name);
      view.saveAndReload();
      browser.sleep(800); // wait for scroll
      expect(view.form.getProperty(0).label.content.getText()).toBe(profileParameters.classes.first.properties.first.name);
    });
  });

  describe('Adds properties to library 2 class 2', () => {

    let page: ModelPage;
    let view: ClassView;

    beforeEach(() => {
      page = ModelPage.navigateToResource(library2Parameters.prefix, library2Parameters.type, classNameToResourceId(library2Parameters.classes.second.name));
      view = page.classView('class');
      browser.wait(view.element.isDisplayed);
    });

    it('adds new attribute using concept suggestion', () => {

      view.edit();
      const searchPredicate = view.addProperty();

      searchPredicate.search(library2Parameters.classes.second.properties.first.name);
      const searchConcept = searchPredicate.selectAddNew(library2Parameters.classes.second.properties.first.type);
      searchConcept.suggestNewConcept();
      searchConcept.definition.appendValue('Definition');
      searchConcept.confirm();
      searchPredicate.confirm();

      browser.sleep(800); // wait for scroll
      view.saveAndReload();
      browser.sleep(800); // wait for scroll
      expect(view.form.getProperty(0).label.content.getText()).toBe(library2Parameters.classes.second.properties.first.name);
    });

    it('adds new association using existing concept', () => {

      view.edit();
      const searchPredicate = view.addProperty();

      searchPredicate.search(library2Parameters.classes.second.properties.second.name);
      const searchConcept = searchPredicate.selectAddNew(library2Parameters.classes.second.properties.second.type);
      searchConcept.selectResultById(library2Parameters.classes.second.properties.second.conceptId);
      searchConcept.confirm();
      searchPredicate.confirm();

      browser.sleep(800); // wait for scroll
      view.saveAndReload();
      browser.sleep(800); // wait for scroll
      expect(view.form.getProperty(1).label.content.getText()).toBe(library2Parameters.classes.second.properties.second.name);
    });

    it('adds existing attribute', () => {

      view.edit();
      const searchPredicate = view.addProperty();

      searchPredicate.search(library2Parameters.classes.second.properties.third.name);
      searchPredicate.selectResultById(library2Parameters.classes.second.properties.third.id);
      searchPredicate.confirm();

      browser.sleep(800); // wait for scroll
      view.saveAndReload();
      browser.sleep(800); // wait for scroll
      expect(view.form.getProperty(2).label.content.getText()).toBe(library2Parameters.classes.second.properties.third.name);
    });

    it('adds existing association', () => {

      view.edit();
      const searchPredicate = view.addProperty();

      searchPredicate.search(library2Parameters.classes.second.properties.fourth.name);
      searchPredicate.selectResultById(library2Parameters.classes.second.properties.fourth.id);
      searchPredicate.confirm();

      browser.sleep(800); // wait for scroll
      view.saveAndReload();
      browser.sleep(800); // wait for scroll
      expect(view.form.getProperty(3).label.content.getText()).toBe(library2Parameters.classes.second.properties.fourth.name);
    });
  });

  it('specializes class with properties from library', () => {

    const page = ModelPage.navigateToExistingModel(profileParameters.prefix, profileParameters.type);

    const searchClass = page.addClass();
    searchClass.search(profileParameters.classes.second.name);
    searchClass.selectResultById(profileParameters.classes.second.id);
    searchClass.confirm();

    new AddPropertiesFromClassModal().confirm();

    const view = page.classView('shape');
    view.saveAndReload();
    expect(view.form.label.content.getText()).toBe(profileParameters.classes.second.name);
  });
});
