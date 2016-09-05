import { EditableComponent } from '../common/component/editableComponent.po';
import { AddModelModal } from './addModelModal.po';
import { navigateAndReturn } from '../../util/browser';

export class GroupPage {

  static path = (id: string) => `/group?id=${encodeURIComponent(id)}`;
  static navigate = (id: string) => navigateAndReturn(GroupPage.path(id), new GroupPage());

  label = EditableComponent.byTitleLocalizationKey(element(by.css('body')), 'Group label');

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
