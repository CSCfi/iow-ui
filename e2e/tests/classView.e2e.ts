import { library2Parameters } from './test-data';
import { ModelPage } from '../pages/model/modelPage.po';
import { NavBar } from '../pages/common/navbar.po';

const navbar = new NavBar();

function times(n: number, cb: () => void) {
  for (let i = 0; i < n; i++) {
    cb();
  }
}

describe('Library 2 class view', () => {

  let page: ModelPage;

  beforeEach(() => {
    navbar.ensureLoggedIn();
    page = ModelPage.navigateToExistingModel(library2Parameters.prefix, library2Parameters.type);
  });

  it('removes properties', () => {

    const view = page.selectClass(library2Parameters.prefix, library2Parameters.classes.second);

    view.edit();

    times(library2Parameters.classes.second.properties.length, () => {
      const propertyView = view.form.getProperty(0);
      propertyView.remove();
    });

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
