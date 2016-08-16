import { ModelPage } from '../pages/model/modelPage.po';
import { GroupPage } from '../pages/group/groupPage.po';
import { expectCurrentUrlToEqualPath } from '../util/url';
import { libraryParameters } from './test-data';
import { NavBar } from '../pages/common/navbar.po';

describe('Model page', () => {

  const page = new ModelPage(libraryParameters.type);
  const groupPage = new GroupPage();
  const navbar = new NavBar();

  describe('Before model is created', () => {

    beforeEach(() => {
      page.navigateToNewModel(libraryParameters);
      navbar.ensureLoggedIn();
    });

    it('Creates saved model', () => {
      page.navigateToNewModel(libraryParameters);
      page.modelView.buttons.save();
      expectCurrentUrlToEqualPath(page.pathToExistingModel(page.modelIdForPrefix(libraryParameters.prefix)));
    });
  });

  describe('After model is created', () => {

    // TODO tests with created model

    it ('Removes model', () => {
      page.navigateToExistingModel(page.modelIdForPrefix(libraryParameters.prefix));
      page.modelView.ensureOpen();
      page.modelView.buttons.removeAndConfirm();
      expectCurrentUrlToEqualPath(groupPage.path(libraryParameters.groupId));
    });
  });
});
