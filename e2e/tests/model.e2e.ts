import { GroupPage } from '../pages/group/group.po';
import { NavBar } from '../pages/common/navbar.po';
import { ModelPage } from '../pages/model/model.po';
import { expectCurrentUrlToEqualPath } from '../util/url';
import { libraryParameters } from './test-data';

describe('Model', () => {

  const groupPage = new GroupPage();
  const navbar = new NavBar();

  beforeEach(() => groupPage.navigate(GroupPage.JHS_ID));

  describe('model creation', () => {

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

      addModelModal.setValues(libraryParameters);

      const modelPage = addModelModal.submit();
      expect(modelPage.modelView.title.getText()).toBe(libraryParameters.label);
      expectCurrentUrlToEqualPath(modelPage.pathToNewModel(libraryParameters));

      modelPage.modelView.buttons.saveButton.click();
      expectCurrentUrlToEqualPath(modelPage.pathToExistingModel(modelPage.modelIdForPrefix(libraryParameters.prefix)));
    });

    it ('removes model', () => {
      const modelPage = new ModelPage(libraryParameters.type);
      modelPage.navigateToExistingModel(modelPage.modelIdForPrefix(libraryParameters.prefix));
      modelPage.modelView.ensureOpen();
      modelPage.modelView.buttons.removeAndConfirm();
      expectCurrentUrlToEqualPath(groupPage.path(GroupPage.JHS_ID));
    });
  });
});
