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

  it('removes classes', () => {
    page.selectClass(library2Parameters.prefix, library2Parameters.classes.first)
      .buttons.removeAndConfirm();

    page.selectClass(library2Parameters.prefix, library2Parameters.classes.second)
      .buttons.removeAndConfirm();

    expect(page.resourceSelectionItems.$$('li').count()).toBe(0);
  });
});
