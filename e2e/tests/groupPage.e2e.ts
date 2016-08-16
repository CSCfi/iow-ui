import { GroupPage } from '../pages/group/groupPage.po';
import { expectCurrentUrlToEqualPath } from '../util/url';
import { NavBar } from '../pages/common/navbar.po';
import { libraryParameters } from './test-data';
import { ModelPage } from '../pages/model/modelPage.po';

describe('Group page', () => {

  let page: GroupPage;
  const navbar = new NavBar();

  beforeEach(() => {
    page = GroupPage.navigate(libraryParameters.groupId);
    navbar.ensureLoggedIn();
  });

  it('Should be logged in', () => {
    expect(navbar.isLoggedIn()).toBe(true);
  });

  it('Should contain group info', () => {
    expect(page.label.content.getText()).toContain('Yhteiset tietokomponentit');
  });

  it('Can open model creation', () => {
    const addModelModal = page.addLibrary();
    expect(addModelModal.title.getText()).toBe('Lisää tietokomponenttikirjasto');
    addModelModal.close();
    expect(addModelModal.isClosed()).toBe(true);
  });

  it('Creates unsaved model', () => {
    const addModelModal = page.addLibrary();
    addModelModal.setValues(libraryParameters);
    const modelPage = addModelModal.submit();
    expect(modelPage.modelView.title.getText()).toBe(libraryParameters.label);
    expectCurrentUrlToEqualPath(ModelPage.pathToNewModel(libraryParameters));
  });
});
