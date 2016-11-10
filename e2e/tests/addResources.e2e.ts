import { ModelPage } from '../pages/model/modelPage.po';
import { NavBar } from '../pages/common/navbar.po';
import { ClassView } from '../pages/editor/classView.po';
import {
  classNameToResourceIdName, ClassDescriptor, PredicateDescriptor,
  PropertyDescriptor, AddResourceParameters
} from '../util/resource';
import { AddPropertiesFromClassModal } from '../pages/editor/modal/addPropertiesFromClassModal.po';
import { PredicateView } from '../pages/editor/predicateView.po';
import { library2Parameters, profileParameters, library1Parameters } from './test-data';

const navbar = new NavBar();

function verifyName(view: ClassView|PredicateView, params: AddResourceParameters, save: boolean) {
  if (save) {
    view.saveAndReload();
  } else {
    view.reload();
  }
  expect(view.form.label.content.getText()).toBe(params.name);
}

function addClassAndVerify(page: ModelPage, klass: ClassDescriptor, setName: boolean, selectProperties: boolean) {

  page.addClass(klass.origin);

  if (selectProperties) {
    new AddPropertiesFromClassModal().confirm();
  }

  const view = page.classView(klass.type);

  if (setName) {
    view.form.label.setValue(klass.origin.name);
  }

  const save = klass.origin.type !== 'existingResource' || klass.type  !== 'class';

  verifyName(view, klass.origin, save);
}

function addPredicateAndVerify(page: ModelPage, predicate: PredicateDescriptor, setName: boolean) {
  page.addPredicate(predicate.type, predicate.origin);
  const view = page.predicateView(predicate.type);

  if (setName) {
    view.form.label.setValue(predicate.origin.name);
  }

  const save = predicate.origin.type !== 'existingResource';

  verifyName(view, predicate.origin, save);
}

function verifyPropertyName(view: ClassView, property: PropertyDescriptor, index: number) {
  view.saveAndReload();
  browser.sleep(800); // wait for scroll
  expect(view.form.openProperty(index, property.type).label.content.getText()).toBe(property.origin.name);
}

function addPropertyAndVerify(view: ClassView, properties: PropertyDescriptor[], index: number, setName: boolean) {
  const property = properties[index];
  view.edit();
  view.addProperty(property);
  if (setName) {
    view.form.openProperty(index, property.type).label.setValue(property.origin.name);
  }
  verifyPropertyName(view, property, index);
}

describe('Add resources', () => {

  beforeEach(() => {
    navbar.ensureLoggedIn();
  });

  it('adds new classes using existing concepts', () => {
    const page = ModelPage.navigateToExistingModel(library2Parameters.prefix, library2Parameters.type);
    addClassAndVerify(page, library2Parameters.classes.first, false, false);
    addClassAndVerify(page, library2Parameters.classes.second, false, false);
  });

  it('adds new class using concept suggestion', () => {
    const page = ModelPage.navigateToExistingModel(library1Parameters.prefix, library1Parameters.type);
    addClassAndVerify(page, library1Parameters.classes.first, false, false);
  });

  it('adds new attribute using concept suggestion', () => {
    const page = ModelPage.navigateToExistingModel(library2Parameters.prefix, library2Parameters.type);
    addPredicateAndVerify(page, library2Parameters.attributes.first, false);
  });

  it('adds new association using concept suggestion', () => {
    const page = ModelPage.navigateToExistingModel(library2Parameters.prefix, library2Parameters.type);
    addPredicateAndVerify(page, library2Parameters.associations.first, false);
  });

  it('assigns class from another library', () => {
    const page = ModelPage.navigateToExistingModel(library1Parameters.prefix, library1Parameters.type);
    addClassAndVerify(page, library1Parameters.classes.second, false, false);
  });

  it('specializes class without properties from library', () => {
    const page = ModelPage.navigateToExistingModel(profileParameters.prefix, profileParameters.type);
    addClassAndVerify(page, profileParameters.classes.first, false, false);
  });

  describe('Adds properties to profile class', () => {

    let page: ModelPage;
    let view: ClassView;

    beforeEach(() => {
      page = ModelPage.navigateToResource(profileParameters.prefix, profileParameters.type, classNameToResourceIdName(profileParameters.classes.first.origin.name));
      view = page.classView('shape');
    });

    it('adds external attribute', () => {
      addPropertyAndVerify(view, profileParameters.classes.first.properties, 0, true);
    });
  });

  describe('Adds properties to library 2 class 2', () => {

    let page: ModelPage;
    let view: ClassView;

    beforeEach(() => {
      page = ModelPage.navigateToResource(library2Parameters.prefix, library2Parameters.type, classNameToResourceIdName(library2Parameters.classes.second.origin.name));
      view = page.classView('class');
      browser.wait(view.element.isDisplayed);
    });

    it('adds new attribute using concept suggestion', () => {
      addPropertyAndVerify(view, library2Parameters.classes.second.properties, 0, false);
    });

    it('adds new association using existing concept', () => {
      addPropertyAndVerify(view, library2Parameters.classes.second.properties, 1, false);
    });

    it('adds existing attribute', () => {
      addPropertyAndVerify(view, library2Parameters.classes.second.properties, 2, false);
    });

    it('adds existing association', () => {
      addPropertyAndVerify(view, library2Parameters.classes.second.properties, 3, false);
    });
  });

  it('specializes class with properties from library', () => {
    const page = ModelPage.navigateToExistingModel(profileParameters.prefix, profileParameters.type);
    addClassAndVerify(page, profileParameters.classes.second, false, true);
  });

  it('specializes external class', () => {
    const page = ModelPage.navigateToExistingModel(profileParameters.prefix, profileParameters.type);
    addClassAndVerify(page, profileParameters.classes.third, true, false);
  });
});
