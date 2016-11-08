import { ModelPage } from '../pages/model/modelPage.po';
import { NavBar } from '../pages/common/navbar.po';
import { library1Parameters, library2Parameters, profileParameters } from './test-data';
import { ClassView } from '../pages/editor/classView.po';
import { classNameToResourceId } from '../util/resource';

const navbar = new NavBar();

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


  describe('Adds properties', () => {

    let page: ModelPage;
    let view: ClassView;

    beforeEach(() => {
      page = ModelPage.navigateToResource(library1Parameters.prefix, library1Parameters.type, classNameToResourceId(library1Parameters.classes.first.name));
      view = page.classView('class')
    });

    it('adds attribute using existing concept', () => {

      view.edit();
      const searchPredicate = view.addProperty();

      searchPredicate.search(library1Parameters.classes.first.properties.first.name);
      const searchConcept = searchPredicate.selectAddNew(library1Parameters.classes.first.properties.first.type);
      searchConcept.suggestNewConcept();
      searchConcept.definition.appendValue('Definition');
      searchConcept.confirm();
      searchPredicate.confirm();

      view.saveAndReload();
      expect(view.form.getProperty(0).label.content.getText()).toBe(library1Parameters.classes.first.properties.first.name);
    });
  });
});
