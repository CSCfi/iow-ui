import { EditableComponent } from '../common/component/editableComponent.po';
import { AddModelModal } from './addModelModal.po';
import EC = protractor.ExpectedConditions;
import { defaultTimeout } from '../../util/expectation';

export class GroupPage {

  static path = (id: string) => `/group?id=${encodeURIComponent(id)}`;
  static navigate = (id: string) => {
    browser.get(GroupPage.path(id));
    const page = new GroupPage();
    page.waitToBeRendered();
    return page;
  };

  label = EditableComponent.byTitleLocalizationKey(element(by.css('body')), 'Group label');

  waitToBeRendered() {
    browser.wait(EC.visibilityOf(this.label.content), defaultTimeout);
  }

  addLibrary() {
    element(by.id('add-library-button')).click();
    return new AddModelModal('library');
  };

  addProfile() {
    element(by.id('add-profile-button')).click();
    return new AddModelModal('profile');
  };

  static JHS_ID = 'https://tt.eduuni.fi/sites/csc-iow#JHS';
  static KTK_ID = 'https://tt.eduuni.fi/sites/csc-iow#KTK';
}
