import { ModelPage } from '../pages/model/modelPage.po';
import { library2Parameters } from './test-data';
import { NavBar } from '../pages/common/navbar.po';

const navbar = new NavBar();

describe('Library 2 predicate view', () => {

  let page: ModelPage;

  beforeEach(() => {
    navbar.ensureLoggedIn();
    page = ModelPage.navigateToExistingModel(library2Parameters.prefix, library2Parameters.type);
  });

  it('edits predicate', () => {
    const view = page.selectPredicate(library2Parameters.prefix, library2Parameters.attributes.first);
    view.edit();
    const editedDescription = 'foo';
    view.form.description.setValue(editedDescription);
    view.saveAndReload();
    expect(view.form.description.content.getText()).toBe(editedDescription);
  });

  it('removes attributes', () => {

    page.selectPredicate(library2Parameters.prefix, library2Parameters.attributes.first)
      .buttons.removeAndConfirm();

    expect(page.resourceSelectionItems.$$('li').count()).toBe(0);
  });

  it('removes associations', () => {

    page.selectPredicate(library2Parameters.prefix, library2Parameters.associations.first)
      .buttons.removeAndConfirm();

    expect(page.resourceSelectionItems.$$('li').count()).toBe(0);
  });
});
