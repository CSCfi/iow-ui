import { ModelPage } from '../pages/model/modelPage.po';
import { expectCurrentUrlToEqualPath } from '../util/url';
import { libraryParameters } from './test-data';
import { NavBar } from '../pages/common/navbar.po';
import { GroupPage } from '../pages/group/groupPage.po';

describe('Model page', () => {

  let page: ModelPage;
  const navbar = new NavBar();

  describe('Before model is created', () => {

    beforeEach(() => {
      page = ModelPage.navigateToNewModel(libraryParameters);
      navbar.ensureLoggedIn();
    });

    it('Creates saved model', () => {
      page.modelView.buttons.save();
      expectCurrentUrlToEqualPath(ModelPage.pathToExistingModel(ModelPage.modelIdForPrefix(libraryParameters.prefix)));
    });
  });

  describe('After model is created', () => {

    require('./modelView.e2e');
    require('./addResources.e2e');
    require('./classView.e2e');
    require('./predicateView.e2e');

    it('Removes model', () => {
      page = ModelPage.navigateToExistingModel(ModelPage.modelIdForPrefix(libraryParameters.prefix), libraryParameters.type);
      navbar.ensureLoggedIn();
      page.modelView.ensureOpen();
      page.modelView.buttons.removeAndConfirm();
      expectCurrentUrlToEqualPath(GroupPage.path(libraryParameters.groupId));
    });
  });
});
