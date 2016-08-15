import { GroupPage } from './pages/group.po';
import { NavBar } from './components/navbar.po';
import { applicationUrl } from './utils/constants';
import { Language } from '../src/utils/language';
import { ModelPage } from './pages/model.po';
import { Type } from '../src/services/entities';

function expectCurrentUrlToEqualPath(path: string) {
  expect(browser.getCurrentUrl().then(decodeURIComponent)).toEqual(decodeURIComponent(applicationUrl + path));
}

describe('Model', () => {

  const groupPage = new GroupPage();
  const navbar = new NavBar();

  beforeEach(() => groupPage.navigate(groupPage.JHS_ID));

  describe('model creation', () => {

    const values = {
      label: 'E2E Kirjasto',
      prefix: 'e2e',
      language: ['fi', 'en'] as Language[],
      groupId: groupPage.JHS_ID,
      type: 'library' as Type
    };

    beforeEach(() => navbar.ensureLoggedIn());

    it('should be logged in', () => {
      expect(navbar.isLoggedIn()).toBe(true);
    });

    it('can open model creation', () => {
      const addModelModal = groupPage.addLibrary();
      expect(addModelModal.title.getText()).toBe('Lisää tietokomponenttikirjasto');
      addModelModal.close();
      expect(addModelModal.isClosed()).toBe(true);
    });

    it('creates model', () => {
      const addModelModal = groupPage.addLibrary();

      addModelModal.setValues(values);

      const modelPage = addModelModal.submit();
      expect(modelPage.modelView.title.getText()).toBe(values.label);
      expectCurrentUrlToEqualPath(modelPage.pathToNewModel(values));

      modelPage.modelView.buttons.saveButton.click();
      expectCurrentUrlToEqualPath(modelPage.pathToExistingModel(modelPage.modelIdForPrefix(values.prefix)));
    });

    it ('removes model', () => {
      const modelPage = new ModelPage(values.type);
      modelPage.navigateToExistingModel(modelPage.modelIdForPrefix(values.prefix));
      modelPage.modelView.ensureOpen();
      modelPage.modelView.buttons.removeAndConfirm();
      expectCurrentUrlToEqualPath(groupPage.path(groupPage.JHS_ID));
    });
  });
});
