import { library2Parameters } from './test-data';
import { ModelPage } from '../pages/model/modelPage.po';
import { NavBar } from '../pages/common/navbar.po';

const navbar = new NavBar();

describe('Library 2 class view', () => {

  let page: ModelPage;

  beforeEach(() => {
    navbar.ensureLoggedIn();
    page = ModelPage.navigateToExistingModel(library2Parameters.prefix, library2Parameters.type);
  });

  it('shows property predicate details', () => {

    const klass = library2Parameters.classes.second;
    const view = page.selectClass(library2Parameters.prefix, klass);
    const propertyView = view.form.openProperty(0, klass.properties[0].type);

    expect(propertyView.openPropertyReusablePredicate().label).toMatch(/.+/);
  });

  it('edits class', () => {
    const view = page.selectClass(library2Parameters.prefix, library2Parameters.classes.second);
    view.edit();
    const editedDescription = 'foo';
    view.form.description.setValue(editedDescription);
    view.saveAndReload();
    expect(view.form.description.content.getText()).toBe(editedDescription);
  });

  it('removes properties', () => {

    const klass = library2Parameters.classes.second;
    const view = page.selectClass(library2Parameters.prefix, library2Parameters.classes.second);

    view.edit();

    for (const property of klass.properties) {
      view.form.openProperty(0, property.type).remove();
    }

    view.saveAndReload();
    expect(view.form.properties.count()).toBe(0);
  });

  it('removes classes', () => {

    page.selectClass(library2Parameters.prefix, library2Parameters.classes.first)
      .buttons.removeAndConfirm();

    page.selectClass(library2Parameters.prefix, library2Parameters.classes.second)
      .buttons.removeAndConfirm();

    expect(page.resourceSelectionItems.$$('li').count()).toBe(0);
  });
});
