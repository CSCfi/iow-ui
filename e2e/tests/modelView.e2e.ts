import { ModelPage } from '../pages/model/modelPage.po';
import { NavBar } from '../pages/common/navbar.po';
import { libraryParameters } from './test-data';

describe('Model view', () => {

  let page: ModelPage;
  const navbar = new NavBar();

  beforeEach(() => {
    page = ModelPage.navigateToExistingModel(ModelPage.modelIdForPrefix(libraryParameters.prefix), libraryParameters.type);
    navbar.ensureLoggedIn();
    page.modelView.ensureOpen();
  });

  it('Modifies model properties', () => {
    page.modelView.buttons.edit();
    page.modelView.label.appendValue('2');
    page.modelView.description.appendValue('Kuvaus');
    page.modelView.language.addItem('pl');
    page.modelView.buttons.save();

    expect(page.modelView.label.content.getText()).toBe(libraryParameters.label + '2');
    expect(page.modelView.description.content.getText()).toBe('Kuvaus');
    expect(page.modelView.language.content.getText()).toBe('fi, en, pl');
  });
});
